import { json, badRequest, forbidden } from '../../utils/response'
import { issueToken } from '../../utils/token'

export interface Env {
  PRO_UNLOCK_CODES: string
  PRO_TOKEN_PREFIX: string
  PRO_TOKENS: string
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
    return forbidden('unlock disabled')
  }

  if (!allow.includes(code)) {
    return forbidden('invalid code')
  }

  // MVP: 토큰 발급만. (진짜 구독/결제는 웹훅 + DB로 확장)
  const prefix = ctx.env.PRO_TOKEN_PREFIX || 'pro'
  const token = issueToken(prefix)
  return json({ token })
}
