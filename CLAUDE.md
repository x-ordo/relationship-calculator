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
- '익명 템플릿' 기반 스토리 카피 세트 확장

---

## 개발 원칙

### 1. TDD (Test-Driven Development)
- 테스트 먼저 작성 → Red/Green/Refactor 사이클
- 기능 구현 전 테스트 케이스 정의

### 2. 외부 설정
- 수동 설정 필요 시 **GitHub Issue 등록 필수**
- 환경변수, 시크릿 등 외부 의존성 명시

### 3. 디자인 시스템
- **Clean Architecture**: 계층 분리 (domain → shared → components)
- **DI (Dependency Injection)**: 의존성 주입으로 테스트 용이성 확보
- **Event-Driven**: 상태 변경은 이벤트 기반 (`src/state/events.ts`)

### 4. 커밋 메시지
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- AI 언급 금지 (Generated with Claude, Co-Authored-By 등)
- 한국어로 간결하게 작성

### 5. 코드 스타일
- TypeScript strict mode
- ESLint/Prettier 규칙 준수
- **단일 책임 원칙 (SRP)**: 하나의 모듈은 하나의 책임만
- 의존성 최소화, 컴포넌트는 작게

### 6. 응답 원칙

**CTO 관점:**
- 결정 중심 (옵션 나열 X)
- 트레이드오프/리스크/ROI 명시
- P0/P1/P2 우선순위
- 간결함

**객관성:**
- 감정 배제
- 사실 기반
- 정량적 표현

**근거 확보:**
- 공식 문서 참조
- 코드 라인 명시 (예: `file.ts:123`)
- 테스트 결과 포함
- 벤치마크 데이터

**금지 표현:**
- ❌ "아마도...", "~일 것 같습니다"
- ❌ "보통은...", "일반적으로..."
- ❌ 출처 없는 주장

### 7. PR 체크리스트
- [ ] 타입체크 통과 (`pnpm typecheck`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 테스트 통과 (해당 시)
- [ ] 모바일 레이아웃 확인
- [ ] 기존 기능 회귀 없음
- [ ] 보안 취약점 없음
- [ ] 커밋 메시지 컨벤션 준수

---

## 비즈니스 마인드셋

| 항목 | 내용 |
|------|------|
| 소비자 중심 사고 | 리서치/피드백은 최종 사용자 관점 |
| 비즈니스 임팩트 | 수익/비용/시장 영향 고려 |
| 가치 전달 | 기술 ≠ 비즈니스 구분 |
| 시장 현실 | 이상 < 실용 |

B2C/B2B/B2G 전 영역 적용.

---

## Git 규칙
- **main 직접 푸시 절대 금지** → 반드시 feature 브랜치 생성 후 PR
- "Generated with Claude Code" 푸터 사용 금지
- "Co-Authored-By" 사용 금지
- 커밋 메시지는 한국어로 간결하게 작성

## 코드 구조
- 계산 로직: `src/shared/domain`
- 상태 관리: `src/state` (events, reducer, actions)
- UI 컴포넌트: `src/components`
- 서버 코드: `functions/` (프론트와 분리)
- 콘텐츠: `content/` (YAML 파일)
