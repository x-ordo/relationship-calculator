import type { AppEvent } from './events'
import type { AppState } from './state'
import { loadAppState, saveAppState } from '../shared/storage/state'
import { buildReport } from '../shared/domain/report'
import { fakeCoach } from '../shared/rules/fakeCoach'
import { callPaidCoach, toCoachPayload } from '../shared/api/coachApi'
import { maskPii } from '../shared/privacy/pii'
import { requestPayment, handlePaymentCallback, type ProductId } from '../shared/payment/portone'
import { checkFreeCoachLimit, incrementFreeCoachUsage } from '../shared/utils/freeLimit'

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

/** 에러 메시지를 사용자 친화적으로 일반화 */
function toUserFriendlyError(e: unknown): string {
  if (!e) return '잠시 후 다시 시도해주세요'

  // rate limit 에러
  if (typeof e === 'object' && 'status' in (e as any)) {
    const status = (e as any).status
    if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    if (status === 401) return '인증이 필요합니다. PRO 탭에서 토큰을 확인해주세요.'
    if (status === 403) return '접근이 거부되었습니다. PRO 탭에서 토큰을 확인해주세요.'
    if (status >= 500) return '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.'
  }

  // 네트워크 에러
  const msg = typeof e === 'string' ? e : (e as any)?.message || ''
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
    return '네트워크 연결을 확인해주세요'
  }

  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

/** Rate limit 체크 (1분당 5회) */
function checkRateLimit(rateLimit: { requests: number[]; limitPerMinute: number }): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const recentRequests = rateLimit.requests.filter(t => t > oneMinuteAgo)
  const remaining = Math.max(0, rateLimit.limitPerMinute - recentRequests.length)
  const allowed = recentRequests.length < rateLimit.limitPerMinute

  // 가장 오래된 요청이 만료될 때까지 남은 시간
  const oldestRequest = recentRequests.length > 0 ? Math.min(...recentRequests) : now
  const resetInSeconds = Math.max(0, Math.ceil((oldestRequest + 60000 - now) / 1000))

  return { allowed, remaining, resetInSeconds }
}

/** Coach run: free_rules -> paid_api (if enabled) with safe fallback */
export async function runCoach(dispatch: Dispatch, getState: GetState) {
  const s0 = getState()
  const { tone, situation, context } = s0.coachUi.draft

  // Rate limit 체크 (유료 플랜만 적용)
  if (s0.domain.plan !== 'free') {
    const limitCheck = checkRateLimit(s0.coachUi.rateLimit)
    if (!limitCheck.allowed) {
      dispatch({
        type: 'COACH_RUN_FAIL',
        error: `요청 한도에 도달했습니다. ${limitCheck.resetInSeconds}초 후에 다시 시도해주세요.`
      })
      return
    }
  }

  dispatch({ type: 'COACH_RUN_START' })

  const report = buildReport(s0.domain)

  // 유료 플랜 path (plus, pro)
  if (s0.domain.plan !== 'free') {
    const token = s0.domain.entitlement?.token || ''
    if (!token) {
      dispatch({ type: 'COACH_NEED_PRO', need: true })
      dispatch({ type: 'COACH_RUN_FAIL', error: 'PRO 토큰이 없습니다. PRO 탭에서 언락해주세요.' })
      return
    }

    // Rate limit 카운트 추가
    dispatch({ type: 'COACH_RATE_LIMIT_ADD' })

    try {
      const payload = toCoachPayload({ report, situation: maskPii(situation), tone, context })
      const result = await callPaidCoach(payload, token)
      dispatch({ type: 'COACH_RUN_OK', data: result })
      return
    } catch (e) {
      // 에러 메시지 일반화
      const userError = toUserFriendlyError(e)

      // fallback to free (서버 에러 시에만)
      if (typeof e === 'object' && 'status' in (e as any) && (e as any).status >= 500) {
        const fb = fakeCoach({ report, situation, tone, context })
        fb.disclaimer = `${fb.disclaimer}\n(서버 일시 장애로 무료 규칙 코치로 대체되었습니다)`
        dispatch({ type: 'COACH_RUN_OK', data: fb })
        return
      }

      dispatch({ type: 'COACH_RUN_FAIL', error: userError })
      return
    }
  }

  // FREE path - 1일 3회 제한
  const freeLimit = checkFreeCoachLimit()
  if (!freeLimit.allowed) {
    dispatch({ type: 'COACH_NEED_PRO', need: true })
    dispatch({
      type: 'COACH_RUN_FAIL',
      error: `오늘 무료 사용량(${freeLimit.usedToday}회)을 모두 사용했습니다. PRO로 업그레이드하면 무제한 사용 가능합니다.`
    })
    return
  }

  try {
    incrementFreeCoachUsage()
    const result = fakeCoach({ report, situation, tone, context })
    result.disclaimer = `${result.disclaimer}\n(무료: 오늘 ${freeLimit.usedToday + 1}/3회 사용)`
    dispatch({ type: 'COACH_RUN_OK', data: result })
  } catch (e) {
    dispatch({ type: 'COACH_RUN_FAIL', error: toUserFriendlyError(e) })
  }
}

/** PRO 결제: PortOne SDK → 서버 검증 → 토큰 저장 */
export async function purchasePro(dispatch: Dispatch, productId: ProductId) {
  dispatch({ type: 'PAYMENT_START' })
  try {
    const result = await requestPayment(productId, (phase) => {
      if (phase === 'verifying') {
        dispatch({ type: 'PAYMENT_VERIFYING' })
      }
      // sdk_loading, payment_pending은 PAYMENT_START에서 이미 처리됨
    })
    if (result.success === true) {
      dispatch({ type: 'PAYMENT_OK', token: result.token, plan: result.plan, expiresAt: result.expiresAt })
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
      dispatch({ type: 'PAYMENT_OK', token: result.token, plan: result.plan, expiresAt: result.expiresAt })
    } else if (result.success === false) {
      dispatch({ type: 'PAYMENT_FAIL', error: result.error })
    }
  } catch (e) {
    console.error('[checkPaymentCallback]', e)
  }
}
