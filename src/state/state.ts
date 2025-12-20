import type { AppLoad, Tab, DashboardUi, CoachUi, ShareUi, ProUi } from './ui'
import type { AppState as DomainState } from '../shared/storage/state'
import { DEFAULT_STATE } from '../shared/storage/state'
import { idle } from './async'

export type AppState = {
  load: AppLoad
  tab: Tab

  /** persisted domain state (기존 storage/state.ts 스키마를 그대로 사용) */
  domain: DomainState

  /** ui slices (필요한 것부터 점진적으로 중앙화) */
  dashboardUi: DashboardUi
  coachUi: CoachUi
  shareUi: ShareUi
  proUi: ProUi
}

export function initialState(): AppState {
  return {
    load: { kind: 'BOOT' },
    tab: 'dashboard',
    domain: DEFAULT_STATE,

    dashboardUi: { kind: 'EMPTY' },
    coachUi: {
      draft: { tone: '냉정', situation: '', context: 'personal' },
      run: idle(),
      needPro: false,
    },
    shareUi: {
      layoutId: 'L01_CLEAN',
      copyId: 'c1',
      anonMode: true,
      safetyModalOpen: false,
      checklist: {},
      exportPng: idle(),
      webShare: idle(),
    },
    proUi: {
      unlockCode: '',
      unlock: idle(),
      payment: idle(),
    },
  }
}
