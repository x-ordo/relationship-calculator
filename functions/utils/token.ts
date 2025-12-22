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
