// RFC 4180 CSV 파서 — 따옴표 안의 쉼표·줄바꿈·"" 이스케이프 처리. 의존성 없음.
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  const head = rows[0].map(s => s.trim().replace(/^\uFEFF/, ''));
  return rows.slice(1)
    .filter(r => r.length >= head.length - 5)
    .map(r => Object.fromEntries(head.map((k, i) => [k, (r[i] || '').trim()])));
}

module.exports = { parseCSV, toObjects };
