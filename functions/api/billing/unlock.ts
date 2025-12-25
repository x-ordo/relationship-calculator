export interface Env {
  PRO_UNLOCK_CODES: string
  PRO_TOKEN_PREFIX: string
  TOKEN_SECRET: string
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
 * @param expiryDays 만료일 (기본 30일)
 */
async function issueSignedToken(env: Env, expiryDays = 30): Promise<string> {
  const prefix = env.PRO_TOKEN_PREFIX || 'pro'
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const ts = Date.now().toString(36)
  const expiry = (Date.now() + expiryDays * 86400000).toString(36)
  const payload = `${prefix}_${ts}_${rand}_${expiry}`
  const secret = env.TOKEN_SECRET || 'dev-secret-do-not-use-in-prod'
  const sig = await signPayload(payload, secret)
  return `${payload}_${sig}`
}

/**
 * 토큰 만료 여부 확인 (5-part HMAC 토큰 전용)
 */
export function isTokenExpired(token: string): boolean {
  const parts = token.split('_')
  if (parts.length !== 5) return true // 5-part HMAC 형식만 허용
  const expiry = parseInt(parts[3], 36)
  if (isNaN(expiry)) return true
  return Date.now() > expiry
}

/**
 * HMAC 서명 검증 (export for coach.ts)
 */
export async function verifyTokenSignature(token: string, secret: string): Promise<boolean> {
  const parts = token.split('_')
  if (parts.length !== 5) return false

  const [prefix, ts, rand, expiry, sig] = parts
  const payload = `${prefix}_${ts}_${rand}_${expiry}`
  const expectedSig = await signPayload(payload, secret)

  // Constant-time comparison (timing attack 방지)
  if (sig.length !== expectedSig.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  return diff === 0
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: any
  try {
    body = await ctx.request.json()
  } catch {
    return badRequest('invalid json')
  }

  const code = String(body?.code || '').trim()
  if (!code) return badRequest('code required')

  const allow = (ctx.env.PRO_UNLOCK_CODES || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allow.length === 0) {
    // MVP: unlock codes not configured -> deny
    return json({ error: 'unlock disabled' }, { status: 403 })
  }

  if (!allow.includes(code)) {
    return json({ error: 'invalid code' }, { status: 403 })
  }

  // HMAC 서명된 토큰 발급
  const token = await issueSignedToken(ctx.env)
  return json({ token })
}
