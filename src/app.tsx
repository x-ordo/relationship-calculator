/** @jsxImportSource preact */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { CoachPage } from './components/coach/CoachPage'
import { SharePage } from './components/share/SharePage'
import { ProPage } from './components/pro/ProPage'
import { LandingPage } from './components/landing/LandingPage'
import { OnboardingOverlay, needsOnboarding } from './components/onboarding/OnboardingOverlay'
import { BottomNav } from './components/nav/BottomNav'
import { reducer } from './state/reducer'
import { initialState, type AppState } from './state/state'
import type { Tab } from './state/ui'
import { initApp, persistDomain, runCoach, unlockPro, purchasePro, checkPaymentCallback } from './state/actions'
import type { ProductId } from './shared/payment/portone'
import { initTheme, cycleTheme, saveTheme, applyTheme, themeIcon, themeLabel, type Theme } from './shared/utils/theme'
import { useSwipe } from './shared/hooks/useSwipe'

const TAB_ORDER: Tab[] = ['dashboard', 'coach', 'share', 'pro']

const VISITED_KEY = 'roi_visited'

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [theme, setTheme] = useState<Theme>('dark')
  const [showLanding, setShowLanding] = useState(() => {
    // 첫 방문자에게만 랜딩 페이지 표시
    return !localStorage.getItem(VISITED_KEY)
  })

  const stateRef = useRef<AppState>(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const getState = () => stateRef.current

  // init: load persisted domain + check payment callback + theme
  useEffect(() => {
    initApp(dispatch)
    checkPaymentCallback(dispatch)
    setTheme(initTheme())
  }, [])

  const toggleTheme = () => {
    const next = cycleTheme(theme)
    setTheme(next)
    saveTheme(next)
    applyTheme(next)
  }

  const handleStartApp = () => {
    localStorage.setItem(VISITED_KEY, 'true')
    setShowLanding(false)
  }

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
      purchasePro: (productId: ProductId) => purchasePro(dispatch, productId),
    }
  }, [])

  const tab = state.tab
  const isLoading = state.load.kind === 'BOOT' || state.load.kind === 'LOADING'

  // Tab change handler
  const handleTabChange = useCallback((newTab: Tab) => {
    dispatch({ type: 'SET_TAB', tab: newTab })
  }, [])

  // Swipe gesture for tab navigation (mobile)
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = TAB_ORDER.indexOf(tab)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'left') {
      // Swipe left = next tab
      newIndex = Math.min(currentIndex + 1, TAB_ORDER.length - 1)
    } else {
      // Swipe right = previous tab
      newIndex = Math.max(currentIndex - 1, 0)
    }

    if (newIndex !== currentIndex) {
      dispatch({ type: 'SET_TAB', tab: TAB_ORDER[newIndex] })
    }
  }, [tab])

  useSwipe({ onSwipe: handleSwipe, threshold: 80 })

  // 랜딩 페이지 표시
  if (showLanding) {
    return <LandingPage onStart={handleStartApp} />
  }

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
        <button class="btn" onClick={toggleTheme} title={`테마: ${themeLabel(theme)}`} style={{ marginLeft: 8 }}>
          {themeIcon(theme)}
        </button>
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

      <BottomNav tab={tab} onTabChange={handleTabChange} />

      <div class="footer">
        <div class="hint">데이터는 브라우저 로컬에만 저장됩니다. (서버 전송 없음)</div>
        <div class="hint">MVP v0.6.0 · Preact + Vite · useReducer + State Machine</div>
      </div>
    </div>
  )
}
