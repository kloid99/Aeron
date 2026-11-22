// SDR 레코드 → 기본 그래프 집계 (순수 함수, Neo4j 접근 없음)
//   규칙 출처: Notion "정비 온톨로지 프로토타입 구현 결과" — 부품·결함은 SDR 실데이터에서 도출,
//   계통 집중도 60% 미만 부품은 총칭어(isGeneric)로 표시(D-006). 수치는 전부 실제 건수.
const STOP = new Set(['LH', 'RH', 'L', 'R', 'LEFT', 'RIGHT', 'FWD', 'AFT', 'UPPER', 'LOWER',
  'INBD', 'OUTBD', 'ASSY', 'ASSEMBLY', 'NO', 'NR']);

function normalizePart(raw) {
  const toks = String(raw || '').toUpperCase().replace(/[^A-Z ]/g, ' ')
    .split(/\s+/).filter(t => t.length > 1 && !STOP.has(t));
  if (!toks.length) return null;
  let w = toks[toks.length - 1];
  if (w.length > 3 && w.endsWith('S') && !w.endsWith('SS')) w = w.slice(0, -1);
  return w;
}

function aggregate(records, { chapter = '53', minCases = 5, maxCases = 500, genericBelow = 0.6 } = {}) {
  const rows = [];
  for (const r of records) {
    const jasc = (r.JASCCode || '').trim();
    if (!jasc.startsWith(chapter) || jasc.length !== 4) continue;
    const part = normalizePart(r.PartName);
    const cond = (r.PartCondition || '').trim().toUpperCase();
    if (!part || !cond) continue;
    rows.push({ r, jasc, part, cond, raw: (r.PartName || '').trim().toUpperCase() });
  }

  const byPart = new Map();
  for (const x of rows) {
    if (!byPart.has(x.part)) byPart.set(x.part, { n: 0, sys: new Map(), def: new Map(), variants: new Set() });
    const p = byPart.get(x.part);
    p.n++;
    p.sys.set(x.jasc, (p.sys.get(x.jasc) || 0) + 1);
    p.def.set(x.cond, (p.def.get(x.cond) || 0) + 1);
    p.variants.add(x.raw);
  }

  const parts = [], partSystems = [], occurs = [], defectNames = new Set();
  for (const [name, p] of [...byPart.entries()].sort((a, b) => b[1].n - a[1].n)) {
    if (p.n < minCases) continue;
    const top = Math.max(...p.sys.values());
    const confidence = Math.round((top / p.n) * 100) / 100;
    parts.push({ name, caseCount: p.n, confidence, isGeneric: confidence < genericBelow, variantCount: p.variants.size });
    for (const [code, weight] of p.sys) partSystems.push({ part: name, code, weight });
    for (const [defect, weight] of p.def) { occurs.push({ defect, part: name, weight }); defectNames.add(defect); }
  }

  const kept = new Set(parts.map(p => p.name));
  const seen = new Set();
  const cases = rows
    .filter(x => kept.has(x.part))
    .filter(x => (x.r.FuselageStationFrom || x.r.StringerFrom || '').trim() !== '')
    .filter(x => (x.r.Discrepancy || '').trim().length >= 30)
    .sort((a, b) => String(b.r.DifficultyDate).localeCompare(String(a.r.DifficultyDate)))
    .map(x => ({
      id: 'SDR-' + (x.r.OperatorControlNumber || '').trim(),
      partName: x.part,
      aircraft: [x.r.AircraftMake, x.r.AircraftModel].map(s => (s || '').trim()).filter(Boolean).join(' ') || '타사',
      condition: x.cond,
      summary: x.r.Discrepancy.replace(/\s+/g, ' ').trim().slice(0, 400),
      jascCode: x.jasc,
      fsFrom: (x.r.FuselageStationFrom || '').trim(),
      stringer: (x.r.StringerFrom || '').trim(),
      reportedAt: (x.r.DifficultyDate || '').trim(),
    }))
    .filter(c => c.id !== 'SDR-' && !seen.has(c.id) && seen.add(c.id))
    .slice(0, maxCases);

  return { parts, partSystems, defects: [...defectNames].map(name => ({ name })), occurs, cases };
}

module.exports = { normalizePart, aggregate };
