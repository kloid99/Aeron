const fs = require('fs');
// KEY=VALUE 형식 .env 로더. 이미 있는 환경변수는 덮어쓰지 않는다.
function loadEnv(files) {
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
module.exports = { loadEnv };
