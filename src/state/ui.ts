import type { AsyncState } from './async'
import type { CoachResult, CoachTone, CoachContext } from '../shared/rules/fakeCoach'

export type AppLoad =
  | { kind: 'BOOT' }
  | { kind: 'LOADING' }
  | { kind: 'READY' }
  | { kind: 'RECOVERED'; note: string }

export type Tab = 'dashboard' | 'coach' | 'share' | 'pro'

/** Dashboard UI (선택/폼 상태를 중앙화하고 싶을 때 사용) */
export type EntryDraft = {
  personId: string
  date: string // YYYY-MM-DD
  minutes: number
  moneyWon: number
  moodDelta: -2 | -1 | 0 | 1 | 2
  reciprocity: 1 | 2 | 3 | 4 | 5
  boundaryHit: boolean
  note: string
}

export type DashboardUi =
  | { kind: 'EMPTY' }
  | { kind: 'HAS_PEOPLE'; selectedPersonId: string; entryFormOpen: boolean; draft?: EntryDraft; error?: string }

/** Coach UI */
export type CoachUi = {
  draft: { tone: CoachTone; situation: string; context: CoachContext }
  run: AsyncState<CoachResult>
  needPro: boolean
}

/** Share UI (레이아웃/카피/PII 스캔 중앙화) */
export type ShareUi = {
  layoutId: string
  copyId: string
  anonMode: boolean

  safetyModalOpen: boolean
  checklist: Record<string, boolean>
  exportPng: AsyncState<{ filename: string }>
  webShare: AsyncState<{ ok: true }>
}

/** Pro UI */
export type ProUi = {
  unlockCode: string
  unlock: AsyncState<{ token: string }>
}
