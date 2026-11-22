const test = require('node:test');
const assert = require('node:assert');
const { cypher, config } = require('../lib/neo4j');

test('Query API URL을 만든다', () => {
  assert.strictEqual(config().url, 'http://localhost:7474/db/neo4j/query/v2');
});

test('파라미터를 넘기고 행을 객체로 받는다', async () => {
  const rows = await cypher('RETURN $x + 1 AS y, "가" AS k', { x: 1 });
  assert.deepStrictEqual(rows, [{ y: 2, k: '가' }]);
});

test('문법 오류는 reject 된다', async () => {
  await assert.rejects(cypher('RETURN RETURN'));
});

test('2xx가 아닌 응답은 HTTP 상태와 함께 reject 된다', async () => {
  const http = require('http');
  const srv = http.createServer((q, r) => { r.statusCode = 404; r.end('<html>not found</html>'); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const prev = process.env.NEO4J_URI;
  process.env.NEO4J_URI = 'http://127.0.0.1:' + srv.address().port;
  try {
    await assert.rejects(cypher('RETURN 1'), /HTTP 404/);
  } finally {
    if (prev === undefined) delete process.env.NEO4J_URI; else process.env.NEO4J_URI = prev;
    srv.close();
  }
});

test('2xx 응답 본문이 null 이면 reject 된다(멈추지 않는다)', async () => {
  const http = require('http');
  const srv = http.createServer((q, r) => { r.statusCode = 200; r.end('null'); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const prev = process.env.NEO4J_URI;
  process.env.NEO4J_URI = 'http://127.0.0.1:' + srv.address().port;
  try {
    await assert.rejects(cypher('RETURN 1'), /응답 형식 오류/);
  } finally {
    if (prev === undefined) delete process.env.NEO4J_URI; else process.env.NEO4J_URI = prev;
    srv.close();
  }
});
