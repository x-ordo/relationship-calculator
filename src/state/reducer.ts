import type { AppState } from './state'
import type { AppEvent } from './events'
import { loading, success, error as err } from './async'
import { DEFAULT_STATE } from '../shared/storage/state'

export function reducer(s: AppState, e: AppEvent): AppState {
  switch (e.type) {
    case 'APP_INIT':
      return { ...s, load: { kind: 'LOADING' } }

    case 'LOAD_OK': {
      const domain = e.domain
      return {
        ...s,
        load: { kind: 'READY' },
        domain,
        dashboardUi:
          domain.people.length === 0
            ? { kind: 'EMPTY' }
            : { kind: 'HAS_PEOPLE', selectedPersonId: domain.people[0].id, entryFormOpen: false },
      }
    }

    case 'LOAD_FAIL':
      return {
        ...s,
        load: { kind: 'RECOVERED', note: 'storage reset' },
        domain: DEFAULT_STATE,
        dashboardUi: { kind: 'EMPTY' },
      }

    case 'SET_TAB':
      return { ...s, tab: e.tab }

    // domain
    case 'PLAN_SET':
      return { ...s, domain: { ...s.domain, plan: e.plan } }

    case 'TOKEN_SET':
      return {
        ...s,
        domain: { ...s.domain, plan: 'paid', entitlement: { ...s.domain.entitlement, token: e.token } },
      }

    case 'TOKEN_UNSET':
      return {
        ...s,
        domain: { ...s.domain, plan: 'free', entitlement: { ...s.domain.entitlement, token: '' } },
      }

        case 'SETTINGS_PATCH':
      return { ...s, domain: { ...s.domain, settings: { ...s.domain.settings, ...e.patch } } }

case 'PERSON_ADD': {
      const people = [...s.domain.people, e.person]
      return {
        ...s,
        domain: { ...s.domain, people },
        dashboardUi:
          people.length === 0
            ? { kind: 'EMPTY' }
            : { kind: 'HAS_PEOPLE', selectedPersonId: e.person.id, entryFormOpen: false },
      }
    }

    case 'PERSON_DELETE': {
      const people = s.domain.people.filter(p => p.id !== e.personId)
      const entries = s.domain.entries.filter(en => en.personId !== e.personId)
      return {
        ...s,
        domain: { ...s.domain, people, entries },
        dashboardUi:
          people.length === 0
            ? { kind: 'EMPTY' }
            : { kind: 'HAS_PEOPLE', selectedPersonId: people[0].id, entryFormOpen: false },
      }
    }

    case 'ENTRY_ADD':
      return { ...s, domain: { ...s.domain, entries: [e.entry, ...s.domain.entries] } }

    case 'ENTRY_DELETE':
      return { ...s, domain: { ...s.domain, entries: s.domain.entries.filter(x => x.id !== e.entryId) } }

    // coach ui
    case 'COACH_DRAFT':
      return { ...s, coachUi: { ...s.coachUi, draft: { ...s.coachUi.draft, ...e.patch }, needPro: false } }

    case 'COACH_RUN_START':
      return { ...s, coachUi: { ...s.coachUi, run: loading(), needPro: false } }

    case 'COACH_RUN_OK':
      return { ...s, coachUi: { ...s.coachUi, run: success(e.data), needPro: false } }

    case 'COACH_RUN_FAIL':
      return { ...s, coachUi: { ...s.coachUi, run: err(e.error) } }

    case 'COACH_NEED_PRO':
      return { ...s, coachUi: { ...s.coachUi, needPro: e.need } }

    // pro ui
    case 'PRO_CODE':
      return { ...s, proUi: { ...s.proUi, unlockCode: e.code } }

    case 'PRO_UNLOCK_START':
      return { ...s, proUi: { ...s.proUi, unlock: loading() } }

    case 'PRO_UNLOCK_OK':
      return { ...s, proUi: { ...s.proUi, unlock: success({ token: e.token }) } }

    case 'PRO_UNLOCK_FAIL':
      return { ...s, proUi: { ...s.proUi, unlock: err(e.error) } }

    default:
      return s
  }
}
