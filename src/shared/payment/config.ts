/**
 * PortOne 결제 설정
 * 환경변수로 Store ID 관리
 */

export type ProductId = 'plus_lifetime' | 'pro_monthly' | 'pro_yearly'

export type Product = {
  id: ProductId
  name: string
  amount: number
  description: string
}

export const PRODUCTS: Record<ProductId, Product> = {
  plus_lifetime: {
    id: 'plus_lifetime',
    name: 'PLUS 평생 이용권',
    amount: 4900,
    description: '10명 관리, 프리미엄 공유 카드 30종+, AI 판결 3회',
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'PRO 월간 구독',
    amount: 9900,
    description: '무제한 인원, 무제한 AI 판결, 월간 리포트',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'PRO 연간 구독',
    amount: 99000,
    description: '무제한 인원, 무제한 AI 판결, 월간 리포트 (2개월 무료)',
  },
}

/** PortOne Store ID (환경변수에서 로드) */
export const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || ''

/** PortOne Channel Key (환경변수에서 로드) */
export const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY || ''

/** 결제 가능 여부 확인 */
export function isPaymentEnabled(): boolean {
  return Boolean(PORTONE_STORE_ID && PORTONE_CHANNEL_KEY)
}
