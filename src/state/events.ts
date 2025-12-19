import type { AppState as DomainState, Entry, Person, Plan, AppSettings } from '../shared/storage/state'
import type { CoachResult, CoachTone } from '../shared/rules/fakeCoach'

export type AppEvent =
  | { type: 'APP_INIT' }
  | { type: 'LOAD_OK'; domain: DomainState }
  | { type: 'LOAD_FAIL' }
  | { type: 'SET_TAB'; tab: 'dashboard' | 'coach' | 'share' | 'pro' }

  // domain
  | { type: 'PLAN_SET'; plan: Plan }
  | { type: 'TOKEN_SET'; token: string }
  | { type: 'TOKEN_UNSET' }

  | { type: 'SETTINGS_PATCH'; patch: Partial<AppSettings> }

  | { type: 'PERSON_ADD'; person: Person }
  | { type: 'PERSON_DELETE'; personId: string }
  | { type: 'ENTRY_ADD'; entry: Entry }
  | { type: 'ENTRY_DELETE'; entryId: string }

  // coach ui
  | { type: 'COACH_DRAFT'; patch: Partial<{ tone: CoachTone; situation: string }> }
  | { type: 'COACH_RUN_START' }
  | { type: 'COACH_RUN_OK'; data: CoachResult }
  | { type: 'COACH_RUN_FAIL'; error: string }
  | { type: 'COACH_NEED_PRO'; need: boolean }

  // pro ui
  | { type: 'PRO_CODE'; code: string }
  | { type: 'PRO_UNLOCK_START' }
  | { type: 'PRO_UNLOCK_OK'; token: string }
  | { type: 'PRO_UNLOCK_FAIL'; error: string }