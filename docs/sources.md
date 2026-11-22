# 자료 출처와 라이선스

## 원천 데이터 (저장소에 포함)
| 자료 | 파일 | 출처 | 비고 |
|---|---|---|---|
| FAA Service Difficulty Reports 2026 | `data/SDR-2026.csv` | https://www.faa.gov/av-info/download_SDR | CSV 레코드 31,089건. 발표자료의 31,582건과 판본이 다름 |
| FAA JASC Code Table | `data/JASC_Code.pdf` → `kg/jasc_codes.csv` | https://sdrs.faa.gov/documents/JASC_Code.pdf | 547코드·51챕터 추출. PDF에 `1200` 코드가 없어 12챕터는 챕터명이 비어 있고 "12"로 대체 표기됨 |
| 현장용어사전 | `web/현장용어사전.csv` | 팀 작성(현직 정비사 인터뷰 기반) | |

## 근거 교범 (용량 때문에 링크만)
FAA 핸드북 개별 페이지 주소가 확인 시점(2026-11-22)에 열리지 않아, 핸드북 목록 페이지로 연결합니다. 목록에서 각 문서를 찾아 주세요.

| 자료 | 쓰인 곳 | 링크 |
|---|---|---|
| FAA-H-8083-32B Powerplant | 블레이드 절차·공구·주의사항(ATA 72) | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation |
| FAA-H-8083-31B Airframe | 외판 절차(ATA 53) | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation |
| FAA-H-8083-30B General | 용어·일반 정비 | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation |
| AC 120-16G | Work Card·정비 프로그램 | https://www.faa.gov/regulations_policies/advisory_circulars |

## 새로 만든 자료
| 자료 | 만든 방법 | 원본과의 차이 |
|---|---|---|
| 기본 그래프(①) | `kg/build_base.js` — JASC 전체 + SDR ATA 53 집계 | 원 팀의 적재 파일이 없어 같은 규칙(부품명 정규화, 집중도 60%)으로 재작성. 노드 수는 README 수치 표 참고 |
| 실행 기록 그래프(④) | `kg/build_execution.cypher` — 발표자료 68·72p 스키마 | 검증 사례 1건은 시연 시드(`source='시드'`) |
| JASC 코드표 CSV | `kg/tools/extract_jasc.py` | — |

## 이미지·3D 자산
| 자료 | 위치 | 출처·라이선스 |
|---|---|---|
| 결함 사진 6장 | `web/assets/defects/` | 원 팀 자료 — 원출처 기록 없음(확인되면 이 표를 갱신) |
| Indy7 URDF·메시, HPC 블레이드 OBJ | `robot-sim/` | `robot-sim/ASSETS_LICENSE.md` |

## 발표자료·영상 (저장소 밖)
- 최종 발표자료 PDF, 발표 영상·숏 영상: 저장소에 넣지 않음
