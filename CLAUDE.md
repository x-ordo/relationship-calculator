# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 목표
Relationship ROI를 **MVP(v0.5) → 수익화 가능한 v1**으로 올린다.

## 개발 명령어

```bash
# 패키지 설치
corepack enable
pnpm i

# 개발 서버 (http://localhost:5173)
pnpm dev

# 프로덕션 빌드
pnpm build

# 타입 체크 (PR 전 필수)
pnpm typecheck
```

## 절대 금지
- 클라이언트에 LLM API Key 하드코딩
- 실명/연락처/주소 등 신상 노출을 유도하는 UX
- 의료/치료/진단을 표방하는 문구(상담 권유/자기관리 보조는 OK)

## 아키텍처

```
relationship-calculator/
├── src/                    # 프론트엔드 (React + Fluent UI)
│   ├── components/         # UI 컴포넌트 (페이지별 폴더)
│   ├── state/              # 상태 관리
│   │   ├── events.ts       # 모든 이벤트 타입 정의
│   │   ├── reducer.ts      # 순수 리듀서 (이벤트 → 상태 변환)
│   │   ├── actions.ts      # 비동기 액션 (API 호출 등)
│   │   └── state.ts        # 앱 상태 타입
│   ├── shared/
│   │   ├── domain/         # 비즈니스 로직 (순수 함수)
│   │   ├── storage/        # localStorage 영속화
│   │   ├── rules/          # FREE 코치 규칙 기반 로직
│   │   ├── api/            # API 클라이언트
│   │   ├── payment/        # PortOne 결제 연동
│   │   └── privacy/        # PII 마스킹
│   └── styles/             # CSS 모듈 (tokens/, components/)
├── functions/              # Cloudflare Pages Functions (서버)
│   ├── api/ai/coach.ts     # POST /api/ai/coach (PRO 코치)
│   └── api/billing/        # 결제/토큰 API
└── content/                # YAML 콘텐츠 (빌드 시 로드)
    ├── copy.yaml           # 공유 카드 카피
    └── layouts.yaml        # 공유 카드 레이아웃
```

## 상태 관리 패턴

**Event-Driven Architecture (Flux 패턴)**:
```
App.tsx → dispatch(event) → reducer → 새 state → React 리렌더
```

- `events.ts`: 모든 이벤트 타입 Union (예: `PERSON_ADD`, `COACH_RUN_OK`)
- `reducer.ts`: 순수 함수, side effect 없음
- `actions.ts`: 비동기 로직 (API 호출 후 dispatch)

**상태 분리**:
- `domain`: 영속 데이터 (people, entries, settings) → localStorage
- `*Ui`: UI 전용 상태 (dashboardUi, coachUi, proUi)

## 주요 데이터 흐름

### 코치 기능
1. FREE: `fakeCoach.ts` (로컬 규칙 기반, 1일 3회 제한)
2. PRO: `POST /api/ai/coach` → OpenAI 호환 API

### 결제 흐름
1. `purchasePro()` → PortOne SDK
2. 결제 완료 → `POST /api/billing/verify`
3. 토큰 발급 → `domain.entitlement.token` 저장

## 현재 구현된 것 (v0.5)
- FREE 코치: 로컬 규칙 기반 (`src/shared/rules/fakeCoach.ts`)
- PRO 코치: `POST /api/ai/coach` (Cloudflare Pages Functions, OpenAI 호환)
- PRO 언락(알파 배포): `POST /api/billing/unlock` → 토큰 발급
- 공유 PNG: html-to-image → html2canvas → Web Share API

## 우선순위 작업

1) **버그/품질**
   - 입력 폼 validation 강화
   - 모바일 레이아웃 깨짐 점검
   - 공유 PNG export: iOS Safari / 폰트 / CORS 깨짐 케이스 점검

2) **결제(한국)**
   - 결제 완료 후: 서버에서 PRO entitlement 발급
   - 웹훅 검증 + DB 추가
   - 클라이언트는 토큰만 저장 (API Key/시크릿 저장 금지)

3) **유료 LLM 코치 강화**
   - prompt injection 방어(입력 최소, 출력 JSON 강제)
   - rate limit(남용 방지)
   - 로그 최소화(개인정보/민감 텍스트 저장 금지)

---

## 개발 원칙

### 1. TDD (Test-Driven Development)
- 테스트 먼저 작성 → Red/Green/Refactor 사이클

### 2. 외부 설정
- 수동 설정 필요 시 **GitHub Issue 등록 필수**

### 3. 디자인 시스템
- **Clean Architecture**: 계층 분리 (domain → shared → components)
- **DI (Dependency Injection)**: 의존성 주입으로 테스트 용이성 확보

### 4. 커밋 메시지
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- AI 언급 금지 (Generated with Claude, Co-Authored-By 등)
- 한국어로 간결하게 작성

### 5. 코드 스타일
- TypeScript strict mode
- ESLint/Prettier 규칙 준수
- **단일 책임 원칙 (SRP)**: 하나의 모듈은 하나의 책임만

### 6. 응답 원칙
- CTO 관점: 결정 중심, 트레이드오프/리스크/ROI 명시
- 객관성: 감정 배제, 사실 기반, 정량적 표현
- 근거 확보: 공식 문서 참조, 코드 라인 명시
- 금지 표현: "아마도...", "보통은...", 출처 없는 주장

### 7. PR 체크리스트
- [ ] 타입체크 통과 (`pnpm typecheck`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 모바일 레이아웃 확인
- [ ] 기존 기능 회귀 없음
- [ ] 커밋 메시지 컨벤션 준수

---

## Git 규칙
- **main 직접 푸시 절대 금지** → 반드시 feature 브랜치 생성 후 PR
- "Generated with Claude Code" 푸터 사용 금지
- "Co-Authored-By" 사용 금지
- 커밋 메시지는 한국어로 간결하게 작성

---

## Vibe Coding

### Context 제공 원칙
```markdown
# GOOD
"기존 src/shared/rules/fakeCoach.ts 패턴 따라서
PRO 코치 응답 파싱 로직 추가해줘.
참고: src/shared/api/coachApi.ts"
```

### 경계
**Human verification 필수:**
- 보안 관련 코드 (auth, permissions)
- 금융 거래 로직
- 개인정보 처리 코드
- 외부 API 연동 코드
