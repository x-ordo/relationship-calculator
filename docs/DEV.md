# DEV

## 구조
- `src/app.tsx` 탭 기반 라우팅(외부 라우터 의존 X)
- `src/shared/storage/state.ts` 로컬스토리지 상태
- `src/shared/domain/report.ts` 리포트 계산 로직
- `src/components/dashboard` 입력/리포트 UI
- `src/components/share` 공유 카드 + PNG export + PII 스캔
- `src/components/coach` 무료 코치(로컬 규칙)

## 데이터 정책
- MVP는 서버가 없고, 모든 데이터는 브라우저 로컬 저장.

## 유료(LLM) 연동 권장 방식
- 클라이언트에 키 넣지 말고 서버 함수로 감싸기
- “paid” 플랜에서만 서버 endpoint 호출

## 테스트 체크리스트
- 사람 추가/삭제
- 기록 추가 후 대시보드 합계 변경
- 공유 카드 저장(PNG)
- 익명화 토글 시 A/B/C로 변경
- 메모에 전화번호 넣으면 PII 경고 뜨는지


## v0.5 추가
- PRO 탭: 언락 코드 → PRO 토큰 발급(`/api/billing/unlock`)
- 유료 코치: `/api/ai/coach` (Cloudflare Pages Functions)
- 공유 PNG: `html-to-image` 1차 + `html2canvas` 폴백 + Web Share 지원

