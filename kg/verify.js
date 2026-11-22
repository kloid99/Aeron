// 지식그래프 검증 — 발표자료 68p(라벨 21·관계 23), 71p(CQ-1~6), 72p(HITL 제약)
//   사용: node kg/verify.js   (전부 통과하면 종료 코드 0)
const { cypher } = require('./lib/neo4j');

const EXPECTED_LABELS = ['System', 'Part', 'Defect', 'Procedure', 'Step', 'Tool', 'SafetyWarning', 'Document',
  'ExternalCase', 'VerifiedCase', 'WorkOrder', 'WorkRecord', 'InspectionLocation', 'DefectCandidate',
  'Judgment', 'EvidenceItem', 'Action', 'Actor', 'Human', 'Robot', 'AI'];
const EXPECTED_RELS = ['PART_OF', 'CONSISTS_OF', 'CONTAINS', 'HAS_STEP', 'PRECEDES', 'OCCURS_ON', 'HAS_DEFECT',
  'REQUIRES_PROCEDURE', 'REQUIRES_TOOL', 'HAS_WARNING', 'SOURCED_FROM', 'TARGETS', 'EXECUTABLE_BY',
  'PERFORMED_BY', 'INSPECTS', 'DETECTED_IN', 'ON_PART', 'OF_DEFECT', 'JUDGED_BY', 'CONFIRMS', 'RESULTED_IN',
  'EVIDENCED_BY', 'REPORTED_IN'];

function diffSets(expected, actual) {
  const a = new Set(actual), e = new Set(expected);
  return { missing: expected.filter(x => !a.has(x)), extra: actual.filter(x => !e.has(x)) };
}

const atLeastOne = row => row.n > 0;
const zero = row => row.n === 0;
const CHECKS = [
  { name: 'CQ-1 부품별 결함 발생', pass: atLeastOne,
    query: `MATCH (:Defect)-[r:OCCURS_ON]->(:Part {name:'BLADE'}) WHERE r.weight > 0 RETURN count(r) AS n` },
  { name: 'CQ-2 결함 → 절차·공구·주의사항', pass: atLeastOne,
    query: `MATCH (:Defect)-[:REQUIRES_PROCEDURE]->(pr:Procedure)-[:TARGETS]->(:Part {name:'BLADE'})
            MATCH (pr)-[:HAS_STEP]->(:Step) MATCH (pr)-[:REQUIRES_TOOL]->(:Tool) MATCH (pr)-[:HAS_WARNING]->(:SafetyWarning)
            RETURN count(DISTINCT pr) AS n` },
  { name: 'CQ-3 승인된 유사 사례', pass: atLeastOne,
    query: `MATCH (v:VerifiedCase)-[:ON_PART]->(:Part {name:'BLADE'}) RETURN count(v) AS n` },
  { name: 'CQ-4 작업지시 단계·승인 필요', pass: atLeastOne,
    query: `MATCH (:WorkOrder {id:'WO-2026-0805-01'})-[:CONSISTS_OF]->(s:Step) WHERE s.approvalRequired = true RETURN count(s) AS n` },
  { name: 'CQ-5 AI 후보 → 판정 → 조치', pass: atLeastOne,
    query: `MATCH (:DefectCandidate)-[:JUDGED_BY]->(j:Judgment)-[:CONFIRMS]->(:Defect) MATCH (j)-[:RESULTED_IN]->(:Action)
            MATCH (j)-[:PERFORMED_BY]->(:Human) RETURN count(j) AS n` },
  { name: 'CQ-6 검사 위치·증빙 품질', pass: atLeastOne,
    query: `MATCH (l:InspectionLocation {id:'LOC-01'})<-[:INSPECTS]-(:Step) MATCH (e:EvidenceItem {id:'EV-01'})
            WHERE e.qualityScore IS NOT NULL RETURN count(l) AS n` },
  { name: '무결성 · 계통 없는 부품 0건', pass: zero,
    query: `MATCH (p:Part) WHERE NOT (p)-[:PART_OF]->(:System) RETURN count(p) AS n` },
  { name: '무결성 · AI 후보가 결함을 직접 확정 0건', pass: zero,
    query: `MATCH (:DefectCandidate)-[r]->(:Defect) RETURN count(r) AS n` },
  { name: '무결성 · 승인자 없는 검증 사례 0건', pass: zero,
    query: `MATCH (v:VerifiedCase) WHERE v.approvedBy IS NULL AND coalesce(v.source,'') <> 'PoC시연' RETURN count(v) AS n` },
];

async function main() {
  let ok = true;
  const labels = (await cypher('CALL db.labels() YIELD label RETURN collect(label) AS l'))[0].l;
  const rels = (await cypher('CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) AS r'))[0].r;
  const dl = diffSets(EXPECTED_LABELS, labels), dr = diffSets(EXPECTED_RELS, rels);
  const lineOk = (b) => (b ? '✓' : '✗');
  console.log(`\n  ${lineOk(!dl.missing.length && !dl.extra.length)} 라벨 ${labels.length}/21` +
    (dl.missing.length ? ` 누락 ${dl.missing}` : '') + (dl.extra.length ? ` 초과 ${dl.extra}` : ''));
  console.log(`  ${lineOk(!dr.missing.length && !dr.extra.length)} 관계 ${rels.length}/23` +
    (dr.missing.length ? ` 누락 ${dr.missing}` : '') + (dr.extra.length ? ` 초과 ${dr.extra}` : ''));
  ok = ok && !dl.missing.length && !dl.extra.length && !dr.missing.length && !dr.extra.length;

  for (const c of CHECKS) {
    const row = (await cypher(c.query))[0];
    const pass = c.pass(row);
    ok = ok && pass;
    console.log(`  ${lineOk(pass)} ${c.name} (${row.n})`);
  }
  const [cnt] = await cypher('MATCH (n) WITH count(n) AS nodes MATCH ()-[r]->() RETURN nodes, count(r) AS rels');
  console.log(`  · 노드 ${cnt.nodes} · 관계 ${cnt.rels}  (발표 시점 Aura: 1,473 · 2,674)\n`);
  return ok;
}

module.exports = { EXPECTED_LABELS, EXPECTED_RELS, diffSets, CHECKS, main };

if (require.main === module) {
  main().then(ok => { process.exitCode = ok ? 0 : 1; })
    .catch(e => { console.error('  ✗ 검증 실패: ' + e.message); process.exitCode = 1; });
}
