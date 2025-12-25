export type Plan = 'free' | 'paid'

export type PersonCategory = 'personal' | 'work' | 'family'

export type Person = {
  id: string
  name: string
  createdAt: string
  /** B2B: 클라이언트/업무 관계 여부 */
  isClient?: boolean
  /** 관계 분류 */
  category?: PersonCategory
}

export type Entry = {
  id: string
  personId: string
  date: string // YYYY-MM-DD
  minutes: number
  moneyWon: number
  moodDelta: -2 | -1 | 0 | 1 | 2
  reciprocity: 1 | 2 | 3 | 4 | 5
  boundaryHit: boolean
  note: string
}

export type Entitlement = {
  /** 서버에서 발급된 PRO 토큰 (MVP는 단순 토큰, 추후 결제/구독 연동) */
  token: string
  /** ISO datetime */
  expiresAt?: string
}

export type AppSettings = {
  /** 내 시간 1시간당 가치를 얼마로 칠지 (원) */
  hourlyRateWon: number
  /** 공유 카드에서 상대를 A/B/C로 바꿀지 */
  anonymizeOnShare: boolean

  /** 온보딩 완료 여부 */
  onboardingCompleted: boolean
  /** 온보딩 버전 (변경 시 재노출) */
  onboardingVersion: number

  /** 공유 화면 첫 방문 안전 안내를 봤는지 */
  shareSafetyIntroSeen: boolean
}

export type AppState = {
  version: number
  plan: Plan
  entitlement: Entitlement
  settings: AppSettings
  people: Person[]
  entries: Entry[]
}

export const DEFAULT_STATE: AppState = {
  version: 2,
  plan: 'free',
  entitlement: { token: '' },
  settings: {
    hourlyRateWon: 9860, // 2024 최저시급 기준
    anonymizeOnShare: true,
    onboardingCompleted: false,
    onboardingVersion: 1,
    shareSafetyIntroSeen: false,
  },
  people: [],
  entries: [],
}

const KEY = 'relationship_roi_state_v2'
const KEY_V1 = 'relationship_roi_state_v1'

export function loadAppState(): AppState {
  try {
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      // v0.4 이하 데이터(키 v1) 마이그레이션
      raw = localStorage.getItem(KEY_V1)
      if (!raw) return DEFAULT_STATE
    }
    const parsed = JSON.parse(raw)

    // 마이그레이션: timeValuePerHourWon → hourlyRateWon
    if (parsed.settings) {
      if ('timeValuePerHourWon' in parsed.settings && !('hourlyRateWon' in parsed.settings)) {
        parsed.settings.hourlyRateWon = parsed.settings.timeValuePerHourWon
        delete parsed.settings.timeValuePerHourWon
      }
    }

    return {
      ...DEFAULT_STATE,
      ...parsed,
      entitlement: { ...DEFAULT_STATE.entitlement, ...(parsed.entitlement || {}) },
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    } as AppState
  } catch {
    return DEFAULT_STATE
  }
}

export function saveAppState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function resetAppState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}
