import type { AppState as DomainState, Entry, Person, Plan, AppSettings } from '../shared/storage/state'
import type { CoachResult, CoachTone, CoachContext } from '../shared/rules/fakeCoach'

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
  | { type: 'ENTRY_EDIT'; entryId: string; patch: Partial<Omit<Entry, 'id' | 'personId'>> }
  | { type: 'ENTRY_DELETE'; entryId: string }

  | { type: 'BACKUP_RESTORE'; settings: AppSettings; people: Person[]; entries: Entry[] }

  // coach ui
  | { type: 'COACH_DRAFT'; patch: Partial<{ tone: CoachTone; situation: string; context: CoachContext }> }
  | { type: 'COACH_RUN_START' }
  | { type: 'COACH_RUN_OK'; data: CoachResult }
  | { type: 'COACH_RUN_FAIL'; error: string }
  | { type: 'COACH_NEED_PRO'; need: boolean }
  | { type: 'COACH_RATE_LIMIT_ADD' }
  | { type: 'COACH_RATE_LIMIT_RESET' }

  // pro ui
  | { type: 'PRO_CODE'; code: string }
  | { type: 'PRO_UNLOCK_START' }
  | { type: 'PRO_UNLOCK_OK'; token: string }
  | { type: 'PRO_UNLOCK_FAIL'; error: string }

  // payment
  | { type: 'PAYMENT_START' }
  | { type: 'PAYMENT_VERIFYING' }
  | { type: 'PAYMENT_OK'; token: string; expiresAt: string }
  | { type: 'PAYMENT_FAIL'; error: string }
  | { type: 'PAYMENT_RESET' }