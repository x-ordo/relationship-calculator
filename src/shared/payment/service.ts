/**
 * PortOne 결제 서비스
 * 결제 요청 → 검증 → 토큰 발급 플로우
 */

import * as PortOne from '@portone/browser-sdk/v2'
import { PRODUCTS, PORTONE_STORE_ID, PORTONE_CHANNEL_KEY, type ProductId } from './config'

export type PaymentResult = {
  success: true
  token: string
  plan: 'plus' | 'pro'
  expiresAt: string
} | {
  success: false
  error: string
}

/**
 * 결제 요청 ID 생성
 */
function generatePaymentId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `pay_${timestamp}_${random}`
}

/**
 * 결제 진행
 * @param productId 상품 ID
 * @param customerEmail 고객 이메일 (선택)
 */
export async function requestPayment(
  productId: ProductId,
  customerEmail?: string
): Promise<PaymentResult> {
  const product = PRODUCTS[productId]
  if (!product) {
    return { success: false, error: '알 수 없는 상품입니다' }
  }

  if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
    return { success: false, error: '결제 시스템이 설정되지 않았습니다' }
  }

  const paymentId = generatePaymentId()

  try {
    // 1. PortOne 결제 요청
    const response = await PortOne.requestPayment({
      storeId: PORTONE_STORE_ID,
      channelKey: PORTONE_CHANNEL_KEY,
      paymentId,
      orderName: productId,
      totalAmount: product.amount,
      currency: 'CURRENCY_KRW',
      payMethod: 'CARD',
      customer: customerEmail ? { email: customerEmail } : undefined,
      customData: { productId },
    })

    // 2. 결제 응답 확인
    if (response?.code) {
      // 에러 코드가 있으면 실패
      return { success: false, error: response.message || '결제가 취소되었습니다' }
    }

    if (!response?.paymentId) {
      return { success: false, error: '결제 응답이 올바르지 않습니다' }
    }

    // 3. 서버에서 결제 검증
    const verifyRes = await fetch('/api/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: response.paymentId }),
    })

    if (!verifyRes.ok) {
      const errorData = await verifyRes.json().catch(() => ({}))
      return { success: false, error: errorData.error || '결제 검증에 실패했습니다' }
    }

    const data = await verifyRes.json()

    if (!data.token) {
      return { success: false, error: '토큰 발급에 실패했습니다' }
    }

    return {
      success: true,
      token: data.token,
      plan: data.plan,
      expiresAt: data.expiresAt,
    }

  } catch (e: any) {
    console.error('[Payment] Error:', e)
    return { success: false, error: e.message || '결제 처리 중 오류가 발생했습니다' }
  }
}
