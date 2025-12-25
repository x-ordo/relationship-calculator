/**
 * PRO 토큰 관련 유틸리티 함수들
 * functions/api/* 에서 공통으로 사용
 */

/**
 * 암호학적으로 안전한 토큰 생성
 * 형식: {prefix}_{timestamp_base36}_{uuid}_{expiry_base36}
 * @param prefix 토큰 prefix (기본: 'pro')
 * @param expiryDays 만료일 (기본: 30일)
 */
export function issueToken(prefix = 'pro', expiryDays = 30): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const ts = Date.now().toString(36)
  const expiry = (Date.now() + expiryDays * 86400000).toString(36)
  return `${prefix}_${ts}_${rand}_${expiry}`
}

/**
 * 토큰 만료 여부 확인
 * @param token PRO 토큰
 * @param allowLegacy 구형 토큰(4파트 미만) 허용 여부 (기본: false)
 */
export function isTokenExpired(token: string, allowLegacy = false): boolean {
  const parts = token.split('_')
  if (parts.length < 4) {
    return !allowLegacy // 구형 토큰: allowLegacy가 true면 만료 아님
  }
  const expiry = parseInt(parts[3], 36)
  if (isNaN(expiry)) return true
  return Date.now() > expiry
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export function getBearer(req: Request): string {
  const h = req.headers.get('Authorization') || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m?.[1] || ''
}

/**
 * 클라이언트 IP 추출 (Cloudflare 환경)
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('CF-Connecting-IP') ||
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/**
 * HMAC-SHA256 서명 생성
 * @returns base64url 인코딩된 서명 (12자)
 */
export async function signPayload(payload: string, secret: string): Promise<string> {
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
export async function issueSignedToken(prefix: string, expiryDays: number, secret: string): Promise<string> {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const ts = Date.now().toString(36)
  const expiry = (Date.now() + expiryDays * 86400000).toString(36)
  const payload = `${prefix}_${ts}_${rand}_${expiry}`
  const sig = await signPayload(payload, secret)
  return `${payload}_${sig}`
}

/**
 * HMAC 서명 검증
 * 토큰 형식: {prefix}_{ts}_{uuid}_{expiry}_{hmac12}
 */
export async function verifyTokenSignature(token: string, secret: string): Promise<boolean> {
  const parts = token.split('_')
  if (parts.length !== 5) return false // 5-part HMAC 형식만 허용

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

/**
 * 토큰 만료 여부 확인 (5-part HMAC 토큰 전용)
 */
export function isSignedTokenExpired(token: string): boolean {
  const parts = token.split('_')
  if (parts.length !== 5) return true // 5-part HMAC 형식만 허용
  const expiry = parseInt(parts[3], 36)
  if (isNaN(expiry)) return true
  return Date.now() > expiry
}
