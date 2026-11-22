// ① 기본 그래프 적재 — JASC 계통 전체 + SDR ATA 53 부품·결함·사례
//   사용: node kg/build_base.js   (재실행 안전: MERGE, 사례는 같은 출처를 지우고 다시 넣음)
const fs = require('fs');
const path = require('path');
const { cypher } = require('./lib/neo4j');
const { parseCSV, toObjects } = require('./lib/csv');
const { aggregate } = require('./lib/base');

const ROOT = path.join(__dirname, '..');

async function main() {
  const jasc = toObjects(parseCSV(fs.readFileSync(path.join(__dirname, 'jasc_codes.csv'), 'utf8')));
  const sdr = toObjects(parseCSV(fs.readFileSync(path.join(ROOT, 'data', 'SDR-2026.csv'), 'utf8')));
  const g = aggregate(sdr, { chapter: '53' });
  console.log(`  SDR ${sdr.length}건 → ATA 53 부품 ${g.parts.length} · 결함 ${g.defects.length} · 사례 ${g.cases.length}`);

  for (const s of [
    'CREATE CONSTRAINT system_code IF NOT EXISTS FOR (s:System) REQUIRE s.code IS UNIQUE',
    'CREATE CONSTRAINT part_name IF NOT EXISTS FOR (p:Part) REQUIRE p.name IS UNIQUE',
    'CREATE CONSTRAINT defect_name IF NOT EXISTS FOR (d:Defect) REQUIRE d.name IS UNIQUE',
    'CREATE CONSTRAINT ext_case_id IF NOT EXISTS FOR (c:ExternalCase) REQUIRE c.id IS UNIQUE',
  ]) await cypher(s);

  const chapters = [...new Map(jasc.map(r => [r.chapter, { code: r.chapter, name: r.chapterName || r.chapter }])).values()];
  await cypher(`UNWIND $rows AS row MERGE (s:System {code: row.code}) SET s.name = row.name, s.level = 'chapter'`, { rows: chapters });
  await cypher(`UNWIND $rows AS row
    MERGE (s:System {code: row.code}) SET s.name = row.name, s.level = 'sub'
    WITH s, row MATCH (c:System {code: row.chapter}) MERGE (s)-[:PART_OF]->(c)`,
  { rows: jasc.map(r => ({ code: r.code, name: r.name, chapter: r.chapter })) });

  await cypher(`UNWIND $rows AS row MERGE (p:Part {name: row.name})
    SET p.caseCount = row.caseCount, p.confidence = row.confidence, p.isGeneric = row.isGeneric, p.variantCount = row.variantCount`,
  { rows: g.parts });
  await cypher(`UNWIND $rows AS row MATCH (p:Part {name: row.part}), (s:System {code: row.code})
    MERGE (p)-[r:PART_OF]->(s) SET r.weight = row.weight`, { rows: g.partSystems });
  await cypher(`UNWIND $rows AS row MERGE (:Defect {name: row.name})`, { rows: g.defects });
  await cypher(`UNWIND $rows AS row MATCH (d:Defect {name: row.defect}), (p:Part {name: row.part})
    MERGE (d)-[r:OCCURS_ON]->(p) SET r.weight = row.weight`, { rows: g.occurs });

  await cypher(`MATCH (c:ExternalCase {source: 'SDR-2026-BASE'}) DETACH DELETE c`);
  await cypher(`UNWIND $rows AS row
    MERGE (c:ExternalCase {id: row.id})
      SET c.partName = row.partName, c.aircraft = row.aircraft, c.condition = row.condition,
          c.summary = row.summary, c.jascCode = row.jascCode, c.fsFrom = row.fsFrom,
          c.stringer = row.stringer, c.reportedAt = row.reportedAt, c.source = 'SDR-2026-BASE'
    WITH c, row
    MATCH (d:Defect {name: row.condition}) MERGE (c)-[:HAS_DEFECT]->(d)
    WITH c, row
    MATCH (s:System {code: row.jascCode}) MERGE (c)-[:REPORTED_IN]->(s)`, { rows: g.cases });

  const [n] = await cypher(`MATCH (s:System) WITH count(s) AS sys
    MATCH (p:Part) WITH sys, count(p) AS part MATCH (d:Defect) WITH sys, part, count(d) AS def
    MATCH (c:ExternalCase {source:'SDR-2026-BASE'}) RETURN sys, part, def, count(c) AS cases`);
  console.log(`  ✓ System ${n.sys} · Part ${n.part} · Defect ${n.def} · ExternalCase ${n.cases}`);
}

main().catch(e => { console.error('  ✗ 기본 그래프 적재 실패: ' + e.message); process.exitCode = 1; });
