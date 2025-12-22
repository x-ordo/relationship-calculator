# DEV

## 폴더 구조

```
src/
├── app.tsx                      # 메인 App, 탭 기반 라우팅
├── main.tsx                     # Preact 엔트리포인트
├── styles.css                   # 전역 스타일
│
├── state/                       # 상태 관리
│   ├── state.ts                 # AppState 타입 & 초기값
│   ├── reducer.ts               # 상태 업데이트 로직
│   ├── actions.ts               # 비동기 작업 & 사이드이펙트
│   ├── events.ts                # AppEvent 유니온 타입
│   ├── async.ts                 # AsyncState 헬퍼
│   └── ui.ts                    # UI 상태 타입
│
├── components/                  # UI 컴포넌트
│   ├── dashboard/               # 대시보드 (메인 화면)
│   │   ├── DashboardPage.tsx
│   │   ├── QuickLogBar.tsx      # 빠른 입력 폼
│   │   ├── QuickLogSheet.tsx    # 모바일 시트
│   │   ├── QuickLogFab.tsx      # FAB 버튼
│   │   ├── ReceiptCard.tsx      # 영수증 카드
│   │   ├── WeeklySummaryCard.tsx
│   │   ├── InsightBanner.tsx
│   │   ├── EditEntryModal.tsx
│   │   └── BackupRestoreCard.tsx
│   ├── coach/                   # AI 코치
│   │   └── CoachPage.tsx
│   ├── share/                   # 공유 카드
│   │   └── SharePage.tsx
│   ├── pro/                     # 결제/업그레이드
│   │   └── ProPage.tsx
│   ├── person/                  # 사람별 상세
│   │   └── PersonDetailPage.tsx
│   ├── onboarding/              # 온보딩
│   │   └── OnboardingOverlay.tsx
│   ├── common/                  # 공통 컴포넌트
│   │   └── VoiceInputButton.tsx
│   └── nav/                     # 네비게이션
│       └── BottomNav.tsx
│
└── shared/                      # 공유 로직
    ├── domain/                  # 비즈니스 로직
    │   ├── report.ts            # ROI 리포트 계산
    │   └── insights.ts          # 주간 인사이트 생성
    ├── rules/                   # 로컬 규칙
    │   └── fakeCoach.ts         # FREE 코치 (로컬)
    ├── api/                     # 외부 API
    │   └── coachApi.ts          # PRO 코치 API 호출
    ├── payment/                 # 결제
    │   └── portone.ts           # PortOne V2 SDK
    ├── privacy/                 # 개인정보
    │   ├── pii.ts               # PII 스캔 & 마스킹
    │   └── shareSafety.ts       # 공유 안전 점수
    ├── storage/                 # 저장소
    │   └── state.ts             # localStorage 관리
    ├── ui/                      # UI 데이터
    │   └── shareCardLayouts.ts  # 공유 카드 테마
    ├── copy/                    # 텍스트 템플릿
    │   └── shareCardCopy.ts
    ├── utils/                   # 유틸리티
    │   ├── validation.ts        # 입력값 검증
    │   ├── exportShareCard.ts   # PNG 내보내기
    │   ├── anonymize.ts         # 이름 익명화
    │   ├── backup.ts            # JSON 백업/복원
    │   ├── freeLimit.ts         # 무료 사용 제한
    │   └── theme.ts             # 다크/라이트 테마
    └── hooks/                   # 커스텀 훅
        ├── useSwipe.ts          # 스와이프 제스처
        └── useSpeechRecognition.ts

functions/                       # Cloudflare Pages Functions
├── utils/                       # 공통 유틸
│   ├── response.ts              # HTTP 응답 헬퍼
│   └── token.ts                 # PRO 토큰 관리
└── api/
    ├── ai/
    │   └── coach.ts             # PRO 코치 (LLM)
    └── billing/
        ├── unlock.ts            # PRO 언락 코드
        └── verify.ts            # 결제 검증
```

## 데이터 정책

- MVP는 서버가 없고, 모든 데이터는 브라우저 로컬 저장
- 민감 정보(API Key, 시크릿)는 서버(functions)에만 보관
- 클라이언트는 토큰만 저장

## 개발 규칙

- 의존성 최소화 (Preact + 필수 라이브러리만)
- UI 컴포넌트는 작게 유지
- 계산 로직은 `src/shared/domain`에 집중
- 서버 코드는 `functions/`에만 (프론트와 분리)
- 중복 코드는 `functions/utils/`로 추출

## 테스트 체크리스트

- [ ] 사람 추가/삭제
- [ ] 기록 추가 후 대시보드 합계 변경
- [ ] 공유 카드 저장(PNG)
- [ ] 익명화 토글 시 A/B/C로 변경
- [ ] 메모에 전화번호 넣으면 PII 경고 뜨는지

## v0.6 주요 기능

- PRO 탭: 언락 코드 → PRO 토큰 발급 (`/api/billing/unlock`)
- 유료 코치: `/api/ai/coach` (Cloudflare Pages Functions)
- 결제 검증: `/api/billing/verify` (PortOne V2)
- 공유 PNG: `html-to-image` 1차 + `html2canvas` 폴백 + Web Share 지원
- 모바일 UX: 스와이프 제스처, 음성 입력
