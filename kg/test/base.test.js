const test = require('node:test');
const assert = require('node:assert');
const { normalizePart, aggregate } = require('../lib/base');

test('부품명을 기본형으로 정규화한다', () => {
  assert.strictEqual(normalizePart('FUSELAGE SKIN'), 'SKIN');
  assert.strictEqual(normalizePart('LH DOOR FRAMES'), 'FRAME');
  assert.strictEqual(normalizePart('Seat Track Assy'), 'TRACK');
  assert.strictEqual(normalizePart('BRASS'), 'BRASS');   // SS로 끝나면 단수화하지 않음
  assert.strictEqual(normalizePart('  - 12 '), null);
});

const rec = (o) => ({ JASCCode: '5330', PartName: 'FUSELAGE SKIN', PartCondition: 'CORRODED',
  OperatorControlNumber: 'X1', AircraftMake: 'BOEING', AircraftModel: '737', DifficultyDate: '2026-01-01',
  FuselageStationFrom: '', StringerFrom: '', Discrepancy: 'CORROSION FOUND ON FUSELAGE SKIN AT STATION', ...o });

test('ATA 53만 집계하고 최소 건수 미만 부품은 버린다', () => {
  const recs = [
    ...Array.from({ length: 5 }, (_, i) => rec({ OperatorControlNumber: 'S' + i })),
    rec({ OperatorControlNumber: 'R1', PartName: 'RIB' }),             // 1건 → 제외
    rec({ OperatorControlNumber: 'E1', JASCCode: '7230' }),            // ATA 72 → 제외
  ];
  const g = aggregate(recs, { minCases: 5 });
  assert.deepStrictEqual(g.parts.map(p => p.name), ['SKIN']);
  assert.strictEqual(g.parts[0].caseCount, 5);
  assert.deepStrictEqual(g.occurs, [{ defect: 'CORRODED', part: 'SKIN', weight: 5 }]);
});

test('계통 집중도로 confidence·isGeneric을 정한다', () => {
  const recs = [
    ...Array.from({ length: 3 }, (_, i) => rec({ OperatorControlNumber: 'A' + i, JASCCode: '5330' })),
    ...Array.from({ length: 2 }, (_, i) => rec({ OperatorControlNumber: 'B' + i, JASCCode: '5320' })),
  ];
  const g = aggregate(recs, { minCases: 5 });
  assert.strictEqual(g.parts[0].confidence, 0.6);
  assert.strictEqual(g.parts[0].isGeneric, false);
  assert.deepStrictEqual(g.partSystems.sort((a, b) => a.code.localeCompare(b.code)),
    [{ part: 'SKIN', code: '5320', weight: 2 }, { part: 'SKIN', code: '5330', weight: 3 }]);
});

test('좌표가 있는 사례만 최신순으로 maxCases건 담는다', () => {
  const recs = [
    ...Array.from({ length: 5 }, (_, i) => rec({ OperatorControlNumber: 'C' + i,
      DifficultyDate: '2026-01-0' + (i + 1), StringerFrom: '29L', FuselageStationFrom: '73' })),
    rec({ OperatorControlNumber: 'N1' }),                               // 좌표 없음 → 사례 제외
  ];
  const g = aggregate(recs, { minCases: 5, maxCases: 2 });
  assert.deepStrictEqual(g.cases.map(c => c.id), ['SDR-C4', 'SDR-C3']);
  assert.strictEqual(g.cases[0].stringer, '29L');
  assert.strictEqual(g.cases[0].aircraft, 'BOEING 737');
});
