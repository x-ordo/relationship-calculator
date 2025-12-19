# Onboarding v1 (1분 플로우)

목표: **빈 화면 이탈**을 막고, 1분 안에 “아 이거 재밌네” 체감을 만든다.

## 트리거
- 최초 실행 시 `settings.onboardingCompleted === false` 이거나
- `settings.onboardingVersion !== 1` 이면 재노출

## 단계
### Step 0 — 룰 소개 (10초)
- “손해면 손해” 톤 확립
- 로컬 저장(서버 전송 없음) 강조
- 익명화/체크리스트 강조

### Step 1 — 사람 2명 추가 (20초)
- 직접 입력 + `A/B 자동 생성` 버튼
- 실명 금지 권장(닉네임/이니셜)

### Step 2 — 기록 2개 생성 (20초)
- `샘플 추가` 버튼: `[demo]` 마커가 붙은 2개 기록 생성
  - (1) 경계침해/후회(손해) 1개
  - (2) 상호 이득(이득) 1개
- 중복 생성 방지: note에 `[demo]`가 있으면 버튼 disable

### Step 3 — 공유 카드 미리보기 (10초)
- 순손해/최악의 사람/주 원인 미리보기
- “공유 탭 / 코치 탭”으로 이동 CTA 제공

## 데이터 변경
- 완료/스킵 시
  - `settings.onboardingCompleted = true`
  - `settings.onboardingVersion = 1`

## 구현 파일
- `src/components/onboarding/OnboardingOverlay.tsx`
- `src/styles.css` (Onboarding 섹션)
