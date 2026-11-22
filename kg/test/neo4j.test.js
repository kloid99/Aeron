const test = require('node:test');
const assert = require('node:assert');
const { cypher, config } = require('../lib/neo4j');

test('루트 .env를 읽어 Query API URL을 만든다', () => {
  assert.strictEqual(config().url, 'http://localhost:7474/db/neo4j/query/v2');
});

test('파라미터를 넘기고 행을 객체로 받는다', async () => {
  const rows = await cypher('RETURN $x + 1 AS y, "가" AS k', { x: 1 });
  assert.deepStrictEqual(rows, [{ y: 2, k: '가' }]);
});

test('문법 오류는 reject 된다', async () => {
  await assert.rejects(cypher('RETURN RETURN'));
});
