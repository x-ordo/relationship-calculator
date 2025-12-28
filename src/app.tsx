import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { FluentProvider, TabList, Tab, Button } from '@fluentui/react-components'
import { WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons'
import { customDarkTheme, customLightTheme } from './theme/customTheme'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { CoachPage } from './components/coach/CoachPage'
import { SharePage } from './components/share/SharePage'
import { ProPage } from './components/pro/ProPage'
import { LandingPage } from './components/landing/LandingPage'
import { OnboardingOverlay, needsOnboarding } from './components/onboarding/OnboardingOverlay'
import { BottomNav } from './components/nav/BottomNav'
import { reducer } from './state/reducer'
import { initialState, type AppState } from './state/state'
import type { Tab as TabType } from './state/ui'
import { initApp, persistDomain, runCoach, unlockPro, purchasePro, checkPaymentCallback } from './state/actions'
import type { ProductId } from './shared/payment/portone'
import { initTheme, cycleTheme, saveTheme, applyTheme, type Theme } from './shared/utils/theme'
import { useSwipe } from './shared/hooks/useSwipe'

const TAB_ORDER: TabType[] = ['dashboard', 'coach', 'share', 'pro']

const VISITED_KEY = 'roi_visited_session'

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [theme, setTheme] = useState<Theme>('dark')
  const [showLanding, setShowLanding] = useState(() => {
    return !sessionStorage.getItem(VISITED_KEY)
  })

  const stateRef = useRef<AppState>(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const getState = () => stateRef.current

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
    sessionStorage.setItem(VISITED_KEY, 'true')
    setShowLanding(false)
  }

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

  const handleTabChange = useCallback((newTab: TabType) => {
    dispatch({ type: 'SET_TAB', tab: newTab })
  }, [])

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = TAB_ORDER.indexOf(tab)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'left') {
      newIndex = Math.min(currentIndex + 1, TAB_ORDER.length - 1)
    } else {
      newIndex = Math.max(currentIndex - 1, 0)
    }

    if (newIndex !== currentIndex) {
      dispatch({ type: 'SET_TAB', tab: TAB_ORDER[newIndex] })
    }
  }, [tab])

  useSwipe({ onSwipe: handleSwipe, threshold: 80 })

  const fluentTheme = theme === 'dark' ? customDarkTheme : customLightTheme

  if (showLanding) {
    return (
      <FluentProvider theme={fluentTheme}>
        <LandingPage onStart={handleStartApp} />
      </FluentProvider>
    )
  }

  return (
    <FluentProvider theme={fluentTheme}>
      <div className="app">
        <div className="topbar">
          <div className="brand">
            <div className="logo">ROI</div>
            <div>
              <div className="title">Relationship ROI</div>
              <div className="sub">인간관계 손익 계산기 (MVP)</div>
            </div>
          </div>
          <TabList
            selectedValue={tab}
            onTabSelect={(_, data) => handleTabChange(data.value as TabType)}
            className="tabs"
          >
            <Tab value="dashboard">대시보드</Tab>
            <Tab value="coach">코치</Tab>
            <Tab value="share">공유</Tab>
            <Tab value="pro">PRO</Tab>
          </TabList>
          <Button
            appearance="subtle"
            icon={theme === 'dark' ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
            onClick={toggleTheme}
            title={`테마: ${theme === 'dark' ? '다크' : '라이트'}`}
            style={{ marginLeft: 8 }}
          />
        </div>

        {isLoading ? (
          <div className="page">
            <div className="h1">로딩 중...</div>
            <div className="hint">브라우저 로컬 데이터 불러오는 중</div>
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

        <div className="footer">
          <div className="hint">데이터는 브라우저 로컬에만 저장됩니다. (서버 전송 없음)</div>
          <div className="hint">MVP v0.6.0 · React + Fluent UI · useReducer + State Machine</div>
        </div>
      </div>
    </FluentProvider>
  )
}
