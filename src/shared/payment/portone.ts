/**
 * PortOne V2 클라이언트 SDK 래퍼
 * https://developers.portone.io/docs/ko/sdk/javascript
 *
 * 주의: 실제 storeId는 환경변수로 관리해야 함 (VITE_PORTONE_STORE_ID)
 */

import type { Plan } from '../storage/state'

export type ProductId = 'plus_lifetime' | 'pro_monthly' | 'pro_yearly'

export type Product = {
  id: ProductId
  name: string
  price: number
  description: string
  expiryDays: number
}

export const PRODUCTS: Record<ProductId, Product & { plan: Plan }> = {
  plus_lifetime: {
    id: 'plus_lifetime',
    name: 'PLUS 평생 이용권',
    price: 4900,
    description: '10명 관리, 프리미엄 공유 카드 30종+, AI 판결 3회',
    expiryDays: 36500, // ~100년
    plan: 'plus',
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'PRO 월간',
    price: 9900,
    description: 'AI 판사 무제한 이용 (30일)',
    expiryDays: 30,
    plan: 'pro',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'PRO 연간',
    price: 99000,
    description: 'AI 판사 무제한 이용 (365일) - 2개월 무료',
    expiryDays: 365,
    plan: 'pro',
  },
}

export type PaymentResult = {
  success: true
  paymentId: string
  token: string
  plan: Plan
  expiresAt: string
} | {
  success: false
  error: string
}

/**
 * PortOne SDK 동적 로드
 */
async function loadPortOneSDK(): Promise<any> {
  // 이미 로드되어 있으면 반환
  if ((window as any).PortOne) {
    return (window as any).PortOne
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    script.async = true
    script.onload = () => {
      if ((window as any).PortOne) {
        resolve((window as any).PortOne)
      } else {
        reject(new Error('PortOne SDK load failed'))
      }
    }
    script.onerror = () => reject(new Error('PortOne SDK script error'))
    document.head.appendChild(script)
  })
}

export type PaymentPhaseCallback = (phase: 'sdk_loading' | 'payment_pending' | 'verifying') => void

/**
 * 결제 요청
 */
export async function requestPayment(
  productId: ProductId,
  onPhase?: PaymentPhaseCallback
): Promise<PaymentResult> {
  const product = PRODUCTS[productId]
  if (!product) {
    return { success: false, error: '알 수 없는 상품입니다' }
  }

  // 환경변수에서 storeId 가져오기
  const storeId = (import.meta as any).env?.VITE_PORTONE_STORE_ID
  const channelKey = (import.meta as any).env?.VITE_PORTONE_CHANNEL_KEY

  if (!storeId || !channelKey) {
    console.error('[portone] Missing VITE_PORTONE_STORE_ID or VITE_PORTONE_CHANNEL_KEY')
    return { success: false, error: '결제 시스템 설정이 필요합니다. 관리자에게 문의하세요.' }
  }

  try {
    onPhase?.('sdk_loading')
    const PortOne = await loadPortOneSDK()

    // 고유 주문번호 생성
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    onPhase?.('payment_pending')

    // PortOne V2 결제 요청
    const response = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId: orderId,
      orderName: productId, // 서버에서 상품 식별용
      totalAmount: product.price,
      currency: 'KRW',
      payMethod: 'CARD',
      customer: {
        // 익명 결제 (개인정보 최소화)
      },
      customData: {
        productId,
        productName: product.name,
      },
      // 모바일 결제 후 리다이렉트 URL
      redirectUrl: `${window.location.origin}/pro?payment=callback`,
    })

    // 결제 실패/취소
    if (response.code) {
      console.error('[portone] Payment failed:', response)
      // 사용자 친화적 에러 메시지
      let errorMsg = '결제가 취소되었습니다'
      if (response.code === 'USER_CANCEL') {
        errorMsg = '결제를 취소했습니다'
      } else if (response.code === 'FAILURE') {
        errorMsg = response.message || '결제에 실패했습니다. 카드 정보를 확인해주세요.'
      } else if (response.message) {
        errorMsg = response.message
      }
      return { success: false, error: errorMsg }
    }

    // 결제 성공 → 서버 검증
    onPhase?.('verifying')

    const verifyRes = await fetch('/api/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: response.paymentId }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json().catch(() => ({}))
      return {
        success: false,
        error: data?.error || '결제는 완료되었으나 검증에 실패했습니다. 고객센터에 문의해주세요.',
      }
    }

    const verifyData = await verifyRes.json()

    return {
      success: true,
      paymentId: response.paymentId,
      token: verifyData.token,
      plan: verifyData.plan as Plan,
      expiresAt: verifyData.expiresAt,
    }

  } catch (e: any) {
    console.error('[portone] Error:', e)
    // 네트워크 에러 등 사용자 친화적 메시지
    const msg = e?.message || ''
    if (msg.includes('network') || msg.includes('fetch')) {
      return { success: false, error: '네트워크 연결을 확인해주세요' }
    }
    return { success: false, error: '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 모바일 결제 콜백 처리 (redirectUrl로 돌아온 경우)
 */
export async function handlePaymentCallback(): Promise<PaymentResult | null> {
  const params = new URLSearchParams(window.location.search)
  const paymentId = params.get('paymentId')

  if (!paymentId) {
    return null // 콜백이 아님
  }

  // URL에서 파라미터 제거 (히스토리 정리)
  window.history.replaceState({}, '', window.location.pathname)

  try {
    const verifyRes = await fetch('/api/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json().catch(() => ({}))
      return {
        success: false,
        error: data?.error || '결제 검증 실패',
      }
    }

    const verifyData = await verifyRes.json()

    return {
      success: true,
      paymentId,
      token: verifyData.token,
      plan: verifyData.plan as Plan,
      expiresAt: verifyData.expiresAt,
    }

  } catch (e: any) {
    console.error('[portone] Callback error:', e)
    return {
      success: false,
      error: e?.message || '결제 확인 중 오류',
    }
  }
}
