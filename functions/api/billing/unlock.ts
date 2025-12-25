import { json, badRequest, forbidden } from '../../utils/response'
import { issueSignedToken } from '../../utils/token'

export interface Env {
  PRO_UNLOCK_CODES: string
  PRO_TOKEN_PREFIX: string
  TOKEN_SECRET: string
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

  // HMAC 서명된 토큰 발급
  const prefix = ctx.env.PRO_TOKEN_PREFIX || 'pro'
  const secret = ctx.env.TOKEN_SECRET || 'dev-secret-do-not-use-in-prod'
  const token = await issueSignedToken(prefix, 30, secret)
  return json({ token })
}
