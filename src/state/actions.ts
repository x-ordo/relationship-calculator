import type { AppEvent } from './events'
import type { AppState } from './state'
import { loadAppState, saveAppState } from '../shared/storage/state'
import { buildReport } from '../shared/domain/report'
import { fakeCoach } from '../shared/rules/fakeCoach'
import { callPaidCoach, toCoachPayload } from '../shared/api/coachApi'
import { maskPii } from '../shared/privacy/pii'
import { requestPayment, handlePaymentCallback, type ProductId } from '../shared/payment/portone'

export type Dispatch = (e: AppEvent) => void
export type GetState = () => AppState

/** one-shot init: load persisted domain state */
export function initApp(dispatch: Dispatch) {
  dispatch({ type: 'APP_INIT' })
  try {
    const domain = loadAppState()
    dispatch({ type: 'LOAD_OK', domain })
  } catch {
    dispatch({ type: 'LOAD_FAIL' })
  }
}

/** persist domain state (call from App effect) */
export function persistDomain(domain: AppState['domain']) {
  try {
    saveAppState(domain)
  } catch {
    // ignore
  }
}

function toErrorMessage(e: unknown): string {
  if (!e) return 'Unknown error'
  if (typeof e === 'string') return e
  if (typeof e === 'object' && 'message' in (e as any)) return String((e as any).message)
  return 'Request failed'
}

/** PRO unlock: code -> token */
export async function unlockPro(dispatch: Dispatch, code: string) {
  dispatch({ type: 'PRO_UNLOCK_START' })
  try {
    const res = await fetch('/api/billing/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(txt || `HTTP ${res.status}`)
    }
    const data: any = await res.json().catch(() => ({}))
    const token = String(data?.token || data?.data?.token || '')
    if (!token) throw new Error('token missing')
    dispatch({ type: 'PRO_UNLOCK_OK', token })
    dispatch({ type: 'TOKEN_SET', token })
  } catch (e) {
    dispatch({ type: 'PRO_UNLOCK_FAIL', error: toErrorMessage(e) })
  }
}

/** Coach run: free_rules -> paid_api (if enabled) with safe fallback */
export async function runCoach(dispatch: Dispatch, getState: GetState) {
  const s0 = getState()
  const { tone, situation, context } = s0.coachUi.draft

  dispatch({ type: 'COACH_RUN_START' })

  const report = buildReport(s0.domain)

  // PAID path
  if (s0.domain.plan === 'paid') {
    const token = s0.domain.entitlement?.token || ''
    if (!token) {
      dispatch({ type: 'COACH_NEED_PRO', need: true })
      dispatch({ type: 'COACH_RUN_FAIL', error: 'PRO 토큰이 없습니다. (PRO 탭에서 언락)' })
      return
    }

    try {
      const payload = toCoachPayload({ report, situation: maskPii(situation), tone, context })
      const result = await callPaidCoach(payload, token)
      dispatch({ type: 'COACH_RUN_OK', data: result })
      return
    } catch (e) {
      // fallback to free
      const fb = fakeCoach({ report, situation, tone, context })
      fb.disclaimer = `${fb.disclaimer}\n(유료 호출 실패 → 무료 규칙 코치로 폴백)`
      dispatch({ type: 'COACH_RUN_OK', data: fb })
      return
    }
  }

  // FREE path
  try {
    const result = fakeCoach({ report, situation, tone, context })
    dispatch({ type: 'COACH_RUN_OK', data: result })
  } catch (e) {
    dispatch({ type: 'COACH_RUN_FAIL', error: toErrorMessage(e) })
  }
}

/** PRO 결제: PortOne SDK → 서버 검증 → 토큰 저장 */
export async function purchasePro(dispatch: Dispatch, productId: ProductId) {
  dispatch({ type: 'PAYMENT_START' })
  try {
    const result = await requestPayment(productId)
    if (result.success === true) {
      dispatch({ type: 'PAYMENT_OK', token: result.token, expiresAt: result.expiresAt })
    } else if (result.success === false) {
      dispatch({ type: 'PAYMENT_FAIL', error: result.error })
    }
  } catch (e) {
    dispatch({ type: 'PAYMENT_FAIL', error: toErrorMessage(e) })
  }
}

/** 모바일 결제 콜백 체크 (앱 초기화 시 호출) */
export async function checkPaymentCallback(dispatch: Dispatch) {
  try {
    const result = await handlePaymentCallback()
    if (!result) return // 콜백 아님

    if (result.success === true) {
      dispatch({ type: 'PAYMENT_OK', token: result.token, expiresAt: result.expiresAt })
    } else if (result.success === false) {
      dispatch({ type: 'PAYMENT_FAIL', error: result.error })
    }
  } catch (e) {
    console.error('[checkPaymentCallback]', e)
  }
}
