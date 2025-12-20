# Claude Code Instructions

## 목표
Relationship ROI를 **MVP(v0.5) → 수익화 가능한 v1**으로 올린다.

## 절대 금지
- 클라이언트에 LLM API Key 하드코딩
- 실명/연락처/주소 등 신상 노출을 유도하는 UX
- 의료/치료/진단을 표방하는 문구(상담 권유/자기관리 보조는 OK)

## 현재 구현된 것 (v0.5)
- FREE 코치: 로컬 규칙 기반 (`src/shared/rules/fakeCoach.ts`)
- PRO 코치: `POST /api/ai/coach` (Cloudflare Pages Functions, OpenAI 호환)
- PRO 언락(알파 배포): `POST /api/billing/unlock` → 토큰 발급
- 공유 PNG: html-to-image → html2canvas → Web Share API(가능하면 share, 아니면 download)

## 우선순위 작업 (순서)

1) **버그/품질**
- 입력 폼 validation 강화
- 모바일 레이아웃 깨짐 점검
- 공유 PNG export: iOS Safari / 폰트 / CORS 깨짐 케이스 점검

2) **결제(한국)**
- 결제는 웹 기준: 토스페이먼츠/포트원 중 하나
- 결제 완료 후: 서버에서 PRO entitlement 발급(토큰/만료)
- 웹훅 검증 + DB(유저/구독/영수증) 추가
- 클라이언트는 토큰만 저장하고 API Key/시크릿은 절대 저장 금지

3) **유료 LLM 코치 강화**
- prompt injection 방어(입력 최소, 출력 JSON 강제)
- rate limit(남용 방지)
- 로그 최소화(개인정보/민감 텍스트 저장 금지)

4) **콘텐츠/바이럴**
- 공유 카드 테마 30개로 확장
- ‘익명 템플릿’ 기반 스토리 카피 세트 확장

## 코드 스타일
- 의존성 최소화
- UI는 단순. 컴포넌트는 작게.
- 계산 로직은 `src/shared/domain`에 유지
- 서버 코드는 `functions/`에만 둔다(프론트와 분리)

## Git 규칙
- **main 직접 푸시 절대 금지** → 반드시 feature 브랜치 생성 후 PR
- "Generated with Claude Code" 푸터 사용 금지
- "Co-Authored-By" 사용 금지
- 커밋 메시지는 한국어로 간결하게 작성
