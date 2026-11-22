const test = require('node:test');
const assert = require('node:assert');
const { parseCSV, toObjects } = require('../lib/csv');

test('따옴표 안의 쉼표·줄바꿈·이스케이프 따옴표를 처리한다', () => {
  const rows = parseCSV('a,b\n"x, y","line1\nline2 ""q"""\n');
  assert.deepStrictEqual(rows, [['a', 'b'], ['x, y', 'line1\nline2 "q"']]);
});

test('CRLF와 BOM을 처리하고 헤더로 객체를 만든다', () => {
  const objs = toObjects(parseCSV('\uFEFFk1,k2\r\n v1 ,v2\r\n'));
  assert.deepStrictEqual(objs, [{ k1: 'v1', k2: 'v2' }]);
});
