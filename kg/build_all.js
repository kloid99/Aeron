// 지식그래프 전체 재구축: ① 기본 → ② 블레이드 → ③ 외판 → ④ 실행 기록 → 검증
//   사용: node kg/build_all.js        (Neo4j가 떠 있어야 함: docker compose up -d)
const { execFileSync } = require('child_process');
const path = require('path');

const STEPS = [
  ['① 기본 그래프 (JASC + SDR ATA 53)', 'build_base.js', []],
  ['② 블레이드 서브그래프', 'run_cypher.js', ['d008_blade.cypher']],
  ['② SDR 블레이드 사례', 'load_sdr_blade.js', []],
  ['③ 외판 서브그래프', 'run_cypher.js', ['d008_skin.cypher']],
  ['④ 실행 기록', 'run_cypher.js', ['build_execution.cypher']],
];

for (const [name, script, args] of STEPS) {
  console.log('\n▶ ' + name);
  try {
    execFileSync(process.execPath, [path.join(__dirname, script), ...args.map(a => path.join(__dirname, a))], { stdio: 'inherit' });
  } catch (e) {
    console.error('\n✗ 여기서 멈춤: ' + name);
    process.exit(1);
  }
}

console.log('\n▶ 검증');
require('./verify').main()
  .then(ok => { console.log(ok ? '✓ 전부 통과' : '✗ 검증 실패 항목 있음'); process.exitCode = ok ? 0 : 1; })
  .catch(e => { console.error('✗ 검증 오류: ' + e.message); process.exitCode = 1; });
