const test = require('node:test');
const assert = require('node:assert');
const { diffSets, EXPECTED_LABELS, EXPECTED_RELS } = require('../verify');

test('발표자료 68p 목록 개수', () => {
  assert.strictEqual(new Set(EXPECTED_LABELS).size, 21);
  assert.strictEqual(new Set(EXPECTED_RELS).size, 23);
});

test('누락·초과를 구분한다', () => {
  assert.deepStrictEqual(diffSets(['A', 'B', 'C'], ['B', 'C', 'D']), { missing: ['A'], extra: ['D'] });
});
