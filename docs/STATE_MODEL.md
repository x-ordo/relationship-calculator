# State Model v0.5.1 (Experimental)

이 폴더(`src/state/*`)는 **상태전이표(상태 머신)**를 코드로 고정하는 “표준 상태 모델”입니다.

현재 앱(v0.5)은 `src/shared/storage/state.ts` 기반의 단순 `useState(state)` 패턴을 사용합니다.
즉, **지금 당장 이 모델로 마이그레이션하지 않아도 앱은 정상 동작**합니다.

## 목적
- 화면/로딩/에러/모달 같은 UI 상태가 “불린 지옥”으로 번지지 않게 차단
- 비동기(결제 언락, 코치 API 등)를 `AsyncState<T>`로 통일
- 액션(부수효과)과 리듀서(순수 전이)를 분리

## 제공 파일
- `async.ts`: AsyncState 표준
- `models.ts`: 도메인 모델
- `ui.ts`: 화면(UI) 상태 머신
- `events.ts`: 액션 이벤트
- `reducer.ts`: 순수 전이
- `actions.ts`: 비동기/부수효과 (unlockPro, runCoach 등)

## 적용 순서(권장)
1) `App`에 `useReducer(reducer, initialState())` 도입
2) 기존 `state/setState`를 `dispatch`로 치환
3) 저장소(persist)는 `savePersisted()`로 통일
