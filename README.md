# AERON — 항공정비 Physical AI 작업 실행 운영체계

KT AIVLE School 9기 빅프로젝트 · 수도권 01반 01조 · 제안사 KT + 뉴로메카 · 고객사 대한항공

정비 지식·AI·로봇·기존 시스템을 하나로 연결해, 작업 지시부터 기록까지를 관리하는 항공정비 작업 실행 운영체계의 데모입니다.
대표 시나리오는 **엔진 오버홀 중 분해된 HPC 블레이드 외관검사**입니다. 판정은 항상 정비사가 하고, AI는 결함 후보까지만 제시합니다.

## 구성
| 폴더 | 내용 |
|---|---|
| `web/` | 대시보드 웹앱 — 로그인 · 정비사 AI Copilot · 관리자 대시보드 (Node, 외부 의존성 없음) |
| `kg/` | Neo4j 지식그래프 재구축 스크립트와 검증 |
| `robot-sim/` | Moby + Indy7 블레이드 검사 시뮬레이션 (Python 3.11, PyBullet) |
| `data/` | FAA SDR 2026, JASC 코드표 |
| `docs/` | 발표자료 PDF, 아키텍처, 데이터 정의서, 시나리오, 판단 규칙, 자료 출처 |

## 빠른 실행
필요: Node.js 18+, Docker Desktop

```bash
cp .env.example .env      # Windows cmd: copy .env.example .env
docker compose up -d --wait
node kg/build_all.js
node web/server.js
```
브라우저에서 http://localhost:5173 → 정비사 또는 관리자로 로그인합니다.

- 챗봇 LLM은 선택입니다. `.env`에 `ANTHROPIC_API_KEY` 또는 `GEMINI_API_KEY`를 넣으면 LLM 답변, 비워 두면 지식그래프 기반 규칙 답변으로 동작합니다.
- 로봇 시뮬은 Windows에서 Docker로 실행합니다(PyPI에 Windows용 pybullet 배포본이 없음). 방법은 [`robot-sim/README.md`](robot-sim/README.md)를 보세요. 경로에 한글이 있으면 3D 모델이 로드되지 않습니다.
- Neo4j Aura로 바꾸려면 `.env`의 `NEO4J_URI·USER·DATABASE·PW`만 바꾸고 `node kg/build_all.js`를 다시 실행합니다.

## 지식그래프 수치
| 항목 | 발표 시점(Neo4j Aura) | 이 저장소 재구축 |
|---|---|---|
| 노드 라벨 | 21 | 21 |
| 관계 타입 | 23 | 23 |
| 노드 | 1,473 | 1,328 |
| 관계 | 2,674 | 2,440 |
| Competency Question | CQ-1~6 | CQ-1~6 통과 (`node kg/verify.js`) |

빈 DB에서 `node kg/build_all.js`를 실행한 결과이며, 두 번째 실행도 같은 수치가 나옵니다. 기본 그래프(①)는 System 598(JASC 챕터 51 + 코드 547), Part 72, Defect 77, ExternalCase 500이고, 블레이드 SDR 적재가 ExternalCase 32건(출처 SDR-2026-D008)을 더합니다.

원 팀의 기본 그래프 적재 파일이 없어, 같은 공개 데이터(FAA JASC·SDR)와 같은 규칙으로 다시 만들었습니다. SDR 파일 판본이 달라 노드 수에 차이가 있습니다. 자세한 내용은 [`docs/sources.md`](docs/sources.md).

## 한계
- 대표 시나리오는 HPC 블레이드 외관검사 1개입니다. 외판(ATA 53)은 확장 검증용입니다.
- 작업지시(Work Order)·판정 기록은 시연용 합성 데이터입니다. 실제 대한항공 시스템과는 연결되어 있지 않습니다.
- 로봇은 가상 검사 셀 시뮬레이션이며, 웹앱과는 시연 영상으로 연결됩니다.
- KPI(비부가가치 공수 20%↓ 등)는 발표자료의 PoC 검증 목표이며 이 데모에서 측정한 값이 아닙니다.
- LLM 키가 없을 때 규칙 기반 챗봇은 복합 질문 일부에 일반 안내로만 답합니다. 예: "균열이 발견되면 어디까지 검사해야 하고…". 키워드 규칙은 원본 그대로 두었습니다.
- 재구축 결과(1,328 / 2,440)는 발표 시점 Aura(1,473 / 2,674)와 다릅니다. 원본 적재 파일 없이 공개 데이터로 다시 만든 그래프라서입니다.
