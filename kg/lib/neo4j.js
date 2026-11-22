// Neo4j HTTP Query API 클라이언트 — 로컬 Docker와 Aura 모두 같은 엔드포인트(/db/<DB>/query/v2)
const http = require('http');
const https = require('https');
const path = require('path');
const { loadEnv } = require('./env');

loadEnv([path.join(__dirname, '..', '..', '.env')]);

function config() {
  const base = (process.env.NEO4J_URI || 'http://localhost:7474').replace(/\/$/, '');
  const db = process.env.NEO4J_DATABASE || 'neo4j';
  const user = process.env.NEO4J_USER || 'neo4j';
  const pw = process.env.NEO4J_PW || 'neo4j';
  return { url: base + '/db/' + db + '/query/v2', auth: 'Basic ' + Buffer.from(user + ':' + pw).toString('base64') };
}

function cypher(statement, parameters = {}) {
  const { url, auth } = config();
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ statement, parameters });
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json',
                 Accept: 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      res.setEncoding('utf8');
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.errors && j.errors.length) return reject(new Error(j.errors[0].message));
          const fields = (j.data && j.data.fields) || [];
          const values = (j.data && j.data.values) || [];
          resolve(values.map(v => Object.fromEntries(fields.map((k, i) => [k, v[i]]))));
        } catch (e) { reject(new Error('Neo4j 응답 파싱 실패: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { cypher, config };
