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

function issueToken(env: Env) {
  const prefix = env.PRO_TOKEN_PREFIX || 'pro'
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}_${Date.now().toString(16)}_${rand}`
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
