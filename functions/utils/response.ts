/**
 * HTTP 응답 유틸리티 함수들
 * functions/api/* 에서 공통으로 사용
 */

export function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  })
}

export function badRequest(message = 'bad request') {
  return json({ error: message }, { status: 400 })
}

export function unauthorized(message = 'unauthorized') {
  return json({ error: message }, { status: 401 })
}

export function forbidden(message = 'forbidden') {
  return json({ error: message }, { status: 403 })
}

export function serverError(message = '일시적인 오류가 발생했습니다') {
  return json({ error: message }, { status: 500 })
}
