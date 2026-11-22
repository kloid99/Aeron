// ============================================================
// ④ 실행 기록 — 발표자료 68·72p 스키마의 실행층
//   전제: d008_blade.cypher 적재 완료 (WO-2026-0805-01, WOS-0805-1~5, LOC-01, EV-01, CAND-01, JDG-01, ACT-01)
//   행위자를 Actor로 통합해 사람·로봇·AI의 작업을 같은 구조로 기록한다.
//   수치·규정값은 넣지 않는다. 사례 1건은 시연용 시드(source='시드')임을 명시한다.
// ============================================================

// ── 1. 행위자 ──
MERGE (a:Actor:Human {id:'ACTOR-H-01'}) SET a.name='박재현', a.role='정비사';
MERGE (a:Actor:Human {id:'ACTOR-H-02'}) SET a.name='감독자', a.role='감독자';
MERGE (a:Actor:Robot {id:'ACTOR-R-01'}) SET a.name='MOBY-01 + Indy7', a.role='촬영 수행';
MERGE (a:Actor:AI {id:'ACTOR-AI-01'}) SET a.name='AERON Vision', a.role='결함 후보 제시';

// ── 2. 단계 순서 ──
MATCH (a:Step {id:'WOS-0805-1'}), (b:Step {id:'WOS-0805-2'}) MERGE (a)-[:PRECEDES]->(b);
MATCH (a:Step {id:'WOS-0805-2'}), (b:Step {id:'WOS-0805-3'}) MERGE (a)-[:PRECEDES]->(b);
MATCH (a:Step {id:'WOS-0805-3'}), (b:Step {id:'WOS-0805-4'}) MERGE (a)-[:PRECEDES]->(b);
MATCH (a:Step {id:'WOS-0805-4'}), (b:Step {id:'WOS-0805-5'}) MERGE (a)-[:PRECEDES]->(b);

// ── 3. 단계별 수행 주체 ──
MATCH (s:Step {id:'WOS-0805-1'}), (a:Actor {id:'ACTOR-H-01'}) MERGE (s)-[:EXECUTABLE_BY]->(a);
MATCH (s:Step {id:'WOS-0805-2'}), (a:Actor {id:'ACTOR-H-01'}) MERGE (s)-[:EXECUTABLE_BY]->(a);
MATCH (s:Step {id:'WOS-0805-3'}), (a:Actor {id:'ACTOR-R-01'}) MERGE (s)-[:EXECUTABLE_BY]->(a);
MATCH (s:Step {id:'WOS-0805-4'}), (a:Actor {id:'ACTOR-H-01'}) MERGE (s)-[:EXECUTABLE_BY]->(a);
MATCH (s:Step {id:'WOS-0805-5'}), (a:Actor {id:'ACTOR-H-02'}) MERGE (s)-[:EXECUTABLE_BY]->(a);

// ── 4. 검사·증빙·후보 ──
MATCH (s:Step {id:'WOS-0805-3'}), (l:InspectionLocation {id:'LOC-01'}) MERGE (s)-[:INSPECTS]->(l);
MATCH (c:DefectCandidate {id:'CAND-01'}), (e:EvidenceItem {id:'EV-01'}) MERGE (c)-[:DETECTED_IN]->(e);
MATCH (e:EvidenceItem {id:'EV-01'}), (a:Actor {id:'ACTOR-R-01'}) MERGE (e)-[:PERFORMED_BY]->(a);
MATCH (c:DefectCandidate {id:'CAND-01'}), (a:Actor {id:'ACTOR-AI-01'}) MERGE (c)-[:PERFORMED_BY]->(a);
MATCH (j:Judgment {id:'JDG-01'}), (a:Actor {id:'ACTOR-H-01'}) MERGE (j)-[:PERFORMED_BY]->(a);

// ── 5. 작업 기록 ──
MERGE (r:WorkRecord {id:'WR-0805-01'}) SET r.status='승인 대기', r.workOrder='WO-2026-0805-01';
MATCH (w:WorkOrder {id:'WO-2026-0805-01'}), (r:WorkRecord {id:'WR-0805-01'}) MERGE (w)-[:CONTAINS]->(r);
MATCH (r:WorkRecord {id:'WR-0805-01'}), (e:EvidenceItem {id:'EV-01'}) MERGE (r)-[:CONTAINS]->(e);
MATCH (r:WorkRecord {id:'WR-0805-01'}), (j:Judgment {id:'JDG-01'}) MERGE (r)-[:CONTAINS]->(j);
MATCH (r:WorkRecord {id:'WR-0805-01'}), (x:Action {id:'ACT-01'}) MERGE (r)-[:CONTAINS]->(x);

// ── 6. 검증 사례 (승인된 결과의 지식 환류 — 시연 시드 1건) ──
MERGE (v:VerifiedCase {id:'VC-0805-01'})
  SET v.aircraft='CFM56-7B', v.condition='CORRODED', v.action='수리',
      v.fsFrom='4', v.stringer='017', v.approvedBy='감독자', v.source='시드';
MATCH (v:VerifiedCase {id:'VC-0805-01'}), (p:Part {name:'BLADE'}) MERGE (v)-[:ON_PART]->(p);
MATCH (v:VerifiedCase {id:'VC-0805-01'}), (d:Defect {name:'CORRODED'}) MERGE (v)-[:OF_DEFECT]->(d);
MATCH (v:VerifiedCase {id:'VC-0805-01'}), (w:WorkOrder {id:'WO-2026-0805-01'}) MERGE (v)-[:EVIDENCED_BY]->(w);
