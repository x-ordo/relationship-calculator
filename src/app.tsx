/** @jsxImportSource preact */
import { useEffect, useMemo, useReducer, useRef } from 'preact/hooks'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { CoachPage } from './components/coach/CoachPage'
import { SharePage } from './components/share/SharePage'
import { ProPage } from './components/pro/ProPage'
import { OnboardingOverlay, needsOnboarding } from './components/onboarding/OnboardingOverlay'
import { reducer } from './state/reducer'
import { initialState, type AppState } from './state/state'
import { initApp, persistDomain, runCoach, unlockPro } from './state/actions'

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  const stateRef = useRef<AppState>(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const getState = () => stateRef.current

  // init: load persisted domain
  useEffect(() => {
    initApp(dispatch)
  }, [])

  // persist domain when ready (avoid overwriting storage during BOOT/LOADING)
  useEffect(() => {
    if (state.load.kind === 'READY' || state.load.kind === 'RECOVERED') {
      persistDomain(state.domain)
    }
  }, [state.load.kind, state.domain])

  const actions = useMemo(() => {
    return {
      runCoach: () => runCoach(dispatch, getState),
      unlockPro: (code: string) => unlockPro(dispatch, code),
    }
  }, [])

  const tab = state.tab
  const isLoading = state.load.kind === 'BOOT' || state.load.kind === 'LOADING'

  return (
    <div class="app">
      <div class="topbar">
        <div class="brand">
          <div class="logo">ROI</div>
          <div>
            <div class="title">Relationship ROI</div>
            <div class="sub">인간관계 손익 계산기 (MVP)</div>
          </div>
        </div>
        <div class="tabs">
          <button
            class={`tab ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })}
          >
            대시보드
          </button>
          <button
            class={`tab ${tab === 'coach' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'coach' })}
          >
            코치
          </button>
          <button
            class={`tab ${tab === 'share' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'share' })}
          >
            공유
          </button>
          <button
            class={`tab ${tab === 'pro' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}
          >
            PRO
          </button>
        </div>
      </div>

      {isLoading ? (
        <div class="page">
          <div class="h1">로딩 중...</div>
          <div class="hint">브라우저 로컬 데이터 불러오는 중</div>
        </div>
      ) : (
        <>
          {tab === 'dashboard' && <DashboardPage domain={state.domain} dispatch={dispatch} />}
          {tab === 'coach' && <CoachPage state={state} dispatch={dispatch} actions={actions} />}
          {tab === 'share' && <SharePage domain={state.domain} dispatch={dispatch} />}
          {tab === 'pro' && <ProPage state={state} dispatch={dispatch} actions={actions} />}
        {state.load.kind === 'READY' && needsOnboarding(state.domain) && (
          <OnboardingOverlay domain={state.domain} dispatch={dispatch} />
        )}
        </>
      )}

      <div class="footer">
        <div class="hint">데이터는 브라우저 로컬에만 저장됩니다. (서버 전송 없음)</div>
        <div class="hint">MVP v0.5.8 · Preact + Vite · useReducer + State Machine</div>
      </div>
    </div>
  )
}
