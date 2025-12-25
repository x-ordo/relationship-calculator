/**
 * POST /api/billing/verify
 * PortOne V2 결제 검증 및 PRO 토큰 발급
 */

export interface Env {
  /** PortOne V2 API Secret */
  PORTONE_API_SECRET: string
  /** PRO 토큰 prefix */
  PRO_TOKEN_PREFIX: string
  /** HMAC 서명 시크릿 */
  TOKEN_SECRET: string
  /** Cloudflare KV for issued tokens */
  TOKEN_KV?: KVNamespace
}

/** 가격 테이블 (KRW) */
const PRICE_TABLE: Record<string, number> = {
  'pro_monthly': 9900,
  'pro_yearly': 99000,
}

function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  })
}

function badRequest(message: string) {
  return json({ error: message }, { status: 400 })
}

function unauthorized(message: string) {
  return json({ error: message }, { status: 401 })
}

/**
 * HMAC-SHA256 서명 생성
 * @returns base64url 인코딩된 서명 (12자)
 */
async function signPayload(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 12)
}

/**
 * HMAC 서명된 토큰 생성
 * 형식: {prefix}_{timestamp_base36}_{uuid}_{expiry_base36}_{hmac12}
 */
async function issueSignedToken(prefix: string, expiryDays: number, secret: string): Promise<string> {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const ts = Date.now().toString(36)
  const expiry = (Date.now() + expiryDays * 86400000).toString(36)
  const payload = `${prefix}_${ts}_${rand}_${expiry}`
  const sig = await signPayload(payload, secret)
  return `${payload}_${sig}`
}

/**
 * PortOne V2 API로 결제 조회
 * https://developers.portone.io/api/rest-v2/payment
 */
async function getPortOnePayment(paymentId: string, apiSecret: string) {
  const res = await fetch(`https://api.portone.io/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      'Authorization': `PortOne ${apiSecret}`,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PortOne API error: ${res.status} ${text}`)
  }

  return res.json()
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // 환경변수 검증
  if (!ctx.env.PORTONE_API_SECRET) {
    console.error('[verify] PORTONE_API_SECRET not configured')
    return json({ error: '결제 시스템 설정 오류' }, { status: 500 })
  }

  let body: any
  try {
    body = await ctx.request.json()
  } catch {
    return badRequest('invalid json')
  }

  const paymentId = String(body?.paymentId || '').trim()
  if (!paymentId) {
    return badRequest('paymentId required')
  }

  try {
    // 1. PortOne API로 결제 정보 조회
    const paymentData: any = await getPortOnePayment(paymentId, ctx.env.PORTONE_API_SECRET)

    // 2. 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      return json({ error: '결제가 완료되지 않았습니다', status: paymentData.status }, { status: 400 })
    }

    // 3. 상품 ID 및 금액 검증
    const productId = paymentData.orderName || paymentData.customData?.productId
    const expectedAmount = PRICE_TABLE[productId]

    if (!expectedAmount) {
      console.error('[verify] Unknown product:', productId)
      return json({ error: '알 수 없는 상품입니다' }, { status: 400 })
    }

    const paidAmount = paymentData.amount?.total || paymentData.totalAmount
    if (paidAmount !== expectedAmount) {
      console.error('[verify] Amount mismatch:', { expected: expectedAmount, paid: paidAmount })
      return json({ error: '결제 금액이 일치하지 않습니다' }, { status: 400 })
    }

    // 4. 중복 검증 (이미 발급된 토큰인지 확인)
    if (ctx.env.TOKEN_KV) {
      const existing = await ctx.env.TOKEN_KV.get(`payment:${paymentId}`)
      if (existing) {
        // 이미 발급된 토큰 반환 (멱등성)
        return json({ token: existing, cached: true })
      }
    }

    // 5. PRO 토큰 발급 (HMAC 서명)
    const expiryDays = productId === 'pro_yearly' ? 365 : 30
    const prefix = ctx.env.PRO_TOKEN_PREFIX || 'pro'
    const secret = ctx.env.TOKEN_SECRET || 'dev-secret-do-not-use-in-prod'
    const token = await issueSignedToken(prefix, expiryDays, secret)

    // 6. 토큰 저장 (KV에 결제ID → 토큰 매핑)
    if (ctx.env.TOKEN_KV) {
      // 결제ID로 토큰 조회용 (중복 방지)
      await ctx.env.TOKEN_KV.put(`payment:${paymentId}`, token, {
        expirationTtl: expiryDays * 86400 + 86400, // 만료 + 1일 여유
      })
      // 토큰 유효성 검증용
      await ctx.env.TOKEN_KV.put(`token:${token}`, JSON.stringify({
        paymentId,
        productId,
        amount: paidAmount,
        issuedAt: new Date().toISOString(),
      }), {
        expirationTtl: expiryDays * 86400 + 86400,
      })
    }

    console.log('[verify] Token issued:', { paymentId, productId, tokenPrefix: token.slice(0, 10) })

    return json({
      token,
      expiresAt: new Date(Date.now() + expiryDays * 86400000).toISOString(),
      productId,
    })

  } catch (e: any) {
    console.error('[verify] Error:', e)
    return json({ error: '결제 검증 중 오류가 발생했습니다' }, { status: 500 })
  }
}
