export interface Env {
  PRO_UNLOCK_CODES: string
  PRO_TOKEN_PREFIX: string
  PRO_TOKENS: string
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
 * 암호학적으로 안전한 토큰 생성
 * 형식: {prefix}_{timestamp_base36}_{uuid}_{expiry_base36}
 * @param expiryDays 만료일 (기본 30일)
 */
function issueToken(env: Env, expiryDays = 30) {
  const prefix = env.PRO_TOKEN_PREFIX || 'pro'
  // crypto.randomUUID()는 Cloudflare Workers에서 지원
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const ts = Date.now().toString(36)
  const expiry = (Date.now() + expiryDays * 86400000).toString(36)
  return `${prefix}_${ts}_${rand}_${expiry}`
}

/**
 * 토큰 만료 여부 확인
 */
export function isTokenExpired(token: string): boolean {
  const parts = token.split('_')
  if (parts.length < 4) return true // 구형 토큰은 만료로 처리
  const expiry = parseInt(parts[3], 36)
  if (isNaN(expiry)) return true
  return Date.now() > expiry
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

  // MVP: 토큰 발급만. (진짜 구독/결제는 웹훅 + DB로 확장)
  const token = issueToken(ctx.env)
  return json({ token })
}
