export interface Env {
  LLM_BASE_URL: string
  LLM_API_KEY: string
  LLM_MODEL: string
  /** comma-separated tokens */
  PRO_TOKENS: string
  /** Cloudflare KV for rate limiting */
  RATE_LIMIT_KV?: KVNamespace
}

// Tone 화이트리스트
const ALLOWED_TONES = ['냉정', '정중', '유머'] as const
type AllowedTone = typeof ALLOWED_TONES[number]

// Context 화이트리스트 (B2B/B2C)
const ALLOWED_CONTEXTS = ['personal', 'client'] as const
type AllowedContext = typeof ALLOWED_CONTEXTS[number]

type CoachSentence = { label: string; text: string }

type CoachResponse = {
  title: string
  verdict: string
  reasoning: string
  sentences: CoachSentence[]
  actions: string[]
  grade: 'GUILTY' | 'WARNING' | 'PROBATION' | 'INNOCENT'
  disclaimer: string
}

function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  })
}

function unauthorized(message = 'unauthorized') {
  return json({ error: message }, { status: 401 })
}

function badRequest(message = 'bad request') {
  return json({ error: message }, { status: 400 })
}

function getBearer(req: Request) {
  const h = req.headers.get('Authorization') || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m?.[1] || ''
}

function isAllowed(token: string, env: Env) {
  const allow = (env.PRO_TOKENS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allow.length === 0) return true // MVP: allow-all if env not set
  return allow.includes(token)
}

/**
 * 토큰 만료 여부 확인
 * 토큰 형식: {prefix}_{timestamp}_{uuid}_{expiry}
 */
function isTokenExpired(token: string): boolean {
  const parts = token.split('_')
  if (parts.length < 4) return false // 구형 토큰은 만료 체크 생략 (하위 호환)
  const expiry = parseInt(parts[3], 36)
  if (isNaN(expiry)) return false
  return Date.now() > expiry
}

/**
 * Tone 입력 검증 (Prompt Injection 방어)
 */
function validateTone(raw: unknown): AllowedTone {
  if (typeof raw === 'string' && ALLOWED_TONES.includes(raw as AllowedTone)) {
    return raw as AllowedTone
  }
  return '냉정' // 기본값
}

/**
 * Context 입력 검증 (B2B/B2C)
 */
function validateContext(raw: unknown): AllowedContext {
  if (typeof raw === 'string' && ALLOWED_CONTEXTS.includes(raw as AllowedContext)) {
    return raw as AllowedContext
  }
  return 'personal' // 기본값
}

/**
 * Rate Limiting (토큰+IP 기반, 1분당 5회)
 */
async function checkRateLimit(
  ip: string,
  token: string,
  kv?: KVNamespace
): Promise<{ allowed: boolean; remaining: number }> {
  if (!kv) return { allowed: true, remaining: 5 } // KV 미설정시 통과 (개발환경)

  const bucket = Math.floor(Date.now() / 60000) // 1분 버킷
  const tokenPrefix = token.slice(0, 8) || 'anon'
  const key = `rate:${ip}:${tokenPrefix}:${bucket}`

  const count = Number(await kv.get(key)) || 0
  const limit = 5

  if (count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await kv.put(key, String(count + 1), { expirationTtl: 120 })
  return { allowed: true, remaining: limit - count - 1 }
}

/**
 * 클라이언트 IP 추출
 */
function getClientIP(req: Request): string {
  return req.headers.get('CF-Connecting-IP') ||
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
}

function buildSystemPrompt(context: AllowedContext) {
  const isClient = context === 'client'

  const roleDesc = isClient
    ? '너는 "관계 감사 리포트(Relationship Audit)" 앱의 B2B 전문 AI 판사다. 프리랜서/1인 기업의 클라이언트 관계를 냉정하게 심판한다.'
    : '너는 "관계 감사 리포트(Relationship Audit)" 앱의 AI 판사다. 인간관계를 법원 판결문 형식으로 심판한다.'

  const contextRules = isClient
    ? [
        '- B2B 관점: 수익성, ROI, 단가, 거래조건 중심으로 판단.',
        '- 클라이언트를 "피청구인" 또는 "해당 거래처"로 지칭.',
        '- sentences는 단가 인상, 업무 범위 명시, 거래 종료 등 비즈니스 문구.',
        '- actions는 견적 조정, 결제 조건 변경 등 실무적 조치.',
      ]
    : [
        '- B2C 관점: 감정 손실, 시간 낭비, 상호성 중심으로 판단.',
        '- 상대방을 "피고" 또는 "해당 인물"로 지칭.',
        '- sentences는 손절 선언, 경계 설정, 거래 종료 등 관계 정리 문구.',
        '- actions는 연락 빈도 조절, 거절 연습 등 일상적 조치.',
      ]

  return [
    roleDesc,
    '',
    '목표: 사용자가 감정 과열 상태에서도 "결정"을 내릴 수 있게 법원 판결문처럼 냉정하게 정리한다.',
    '',
    '규칙:',
    '- 의료/치료/진단처럼 말하지 마라. (상담/치료 권유는 가능하지만, 진단명/치료지시는 금지)',
    '- 폭력/불법/자해 관련 조언은 금지. (안전하고 합법적인 대안만)',
    ...contextRules,
    '- grade는 손실액/ROI에 따라: GUILTY(즉시 손절), WARNING(비중 축소), PROBATION(관찰), INNOCENT(유지)',
    '- "독하게" 말하되, 모욕/혐오 표현은 금지.',
    '- 출력은 반드시 JSON 한 덩어리로만. 코드펜스 금지.',
    '',
    'JSON 스키마:',
    '{',
    '  "title": string (예: "판결문 제123456호"),',
    '  "verdict": string (판결 요약 1문장, 피고/클라이언트에게 유죄/경고 등 선고),',
    '  "reasoning": string (판결 이유 2~3문장),',
    '  "sentences": [{"label":string,"text":string}*3] (선고 문구, 복붙용),',
    '  "actions": [string*4] (이행 조항),',
    '  "grade": "GUILTY"|"WARNING"|"PROBATION"|"INNOCENT",',
    '  "disclaimer": string (법적 효력 없음 고지)',
    '}',
  ].join('\n')
}

function buildUserPrompt(payload: any) {
  const tone = validateTone(payload?.tone)
  const context = validateContext(payload?.context)
  const situation = String(payload?.situation || '').slice(0, 2000)
  const r = payload?.report || {}

  // 데이터 최소화: 숫자/라벨만.
  const report = {
    windowLabel: r?.windowLabel,
    totals: r?.totals,
    topCauseLabel: r?.topCauseLabel,
    topPersonLabel: r?.topPersonLabel,
  }

  const contextLabel = context === 'client' ? 'B2B (클라이언트/업무)' : 'B2C (개인 관계)'

  return [
    `톤: ${tone}`,
    `컨텍스트: ${contextLabel}`,
    '',
    '상황(사용자 입력):',
    situation,
    '',
    '이번 달 리포트 요약:',
    JSON.stringify(report),
  ].join('\n')
}

async function callOpenAICompatible(env: Env, messages: any[]) {
  const base = (env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const url = `${base}/chat/completions`
  const body = {
    model: env.LLM_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`LLM upstream error: ${res.status} ${res.statusText} ${t}`)
  }

  const j: any = await res.json()
  const content = j?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')
  return content
}

function normalizeOut(obj: any): CoachResponse {
  const sentences = Array.isArray(obj?.sentences) ? obj.sentences : []
  const actions = Array.isArray(obj?.actions) ? obj.actions : []

  // grade 유효성 검증
  const validGrades = ['GUILTY', 'WARNING', 'PROBATION', 'INNOCENT'] as const
  const grade = validGrades.includes(obj?.grade) ? obj.grade : 'WARNING'

  return {
    title: String(obj?.title || '판결문'),
    verdict: String(obj?.verdict || ''),
    reasoning: String(obj?.reasoning || ''),
    sentences: sentences.slice(0, 3).map((s: any) => ({ label: String(s?.label || ''), text: String(s?.text || '') })),
    actions: actions.slice(0, 4).map((n: any) => String(n)),
    grade,
    disclaimer: String(obj?.disclaimer || '본 판결은 자기관리 보조 목적이며, 법적 효력이 없습니다.'),
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = getBearer(ctx.request)
  const clientIP = getClientIP(ctx.request)

  // 1. 토큰 유효성 검증
  if (!isAllowed(token, ctx.env)) {
    return unauthorized('PRO token required')
  }

  // 2. 토큰 만료 검증
  if (isTokenExpired(token)) {
    return unauthorized('토큰이 만료되었습니다. PRO를 갱신해주세요.')
  }

  // 3. Rate Limiting
  const rateResult = await checkRateLimit(clientIP, token, ctx.env.RATE_LIMIT_KV)
  if (!rateResult.allowed) {
    return json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }

  let payload: any
  try {
    payload = await ctx.request.json()
  } catch {
    return badRequest('invalid json')
  }

  const situation = String(payload?.situation || '').trim()
  if (!situation) return badRequest('situation required')

  try {
    const context = validateContext(payload?.context)
    const system = buildSystemPrompt(context)
    const user = buildUserPrompt(payload)

    const content = await callOpenAICompatible(ctx.env, [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ])

    let obj: any
    try {
      obj = JSON.parse(content)
    } catch {
      // 모델이 JSON 말고 다른 걸 뱉으면 강제 래핑
      obj = { title: '판결문', verdict: content, reasoning: '', sentences: [], actions: [], grade: 'WARNING', disclaimer: '' }
    }

    const out = normalizeOut(obj)
    // 안전망: sentences 3개/actions 4개 부족하면 채움
    while (out.sentences.length < 3) out.sentences.push({ label: '선고', text: '' })
    while (out.actions.length < 4) out.actions.push('')

    // Rate limit 잔여 횟수를 헤더에 포함
    return json(out, {
      headers: { 'X-RateLimit-Remaining': String(rateResult.remaining) },
    })
  } catch (e: any) {
    // 민감정보 미노출: 일반화된 에러 메시지 반환
    console.error('[coach] LLM error:', e) // 서버 로그에만 기록
    return json(
      { error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
