export interface Env {
  LLM_BASE_URL: string
  LLM_API_KEY: string
  LLM_MODEL: string
  /** comma-separated tokens */
  PRO_TOKENS: string
}

type CoachScript = { title: string; text: string }

type CoachResponse = {
  title: string
  diagnosis: string
  scripts: CoachScript[]
  next: string[]
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

function buildSystemPrompt() {
  return [
    '너는 “인간관계 손익계산서(Relationship ROI)” 앱의 유료 코치다.',
    '목표: 사용자가 감정 과열 상태에서도 “결정”을 내릴 수 있게 짧고 단호하게 정리한다.',
    '규칙:',
    '- 의료/치료/진단처럼 말하지 마라. (상담/치료 권유는 가능하지만, 진단명/치료지시는 금지)',
    '- 폭력/불법/자해 관련 조언은 금지. (안전하고 합법적인 대안만)',
    '- 1) 요약판결 1문장, 2) 진단(상황 구조) 2~3문장, 3) 복붙 문장 3개, 4) 다음 행동 4개.',
    '- “독하게” 말하되, 모욕/혐오 표현은 금지.',
    '- 출력은 반드시 JSON 한 덩어리로만. 코드펜스 금지.',
    '',
    'JSON 스키마:',
    '{"title":string,"diagnosis":string,"scripts":[{"title":string,"text":string}*3],"next":[string*4],"disclaimer":string}',
  ].join('\n')
}

function buildUserPrompt(payload: any) {
  const tone = payload?.tone || '냉정'
  const situation = String(payload?.situation || '').slice(0, 2000)
  const r = payload?.report || {}

  // 데이터 최소화: 숫자/라벨만.
  const report = {
    windowLabel: r?.windowLabel,
    totals: r?.totals,
    topCauseLabel: r?.topCauseLabel,
    topPersonLabel: r?.topPersonLabel,
  }

  return [
    `톤: ${tone}`,
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
  const scripts = Array.isArray(obj?.scripts) ? obj.scripts : []
  const next = Array.isArray(obj?.next) ? obj.next : []

  return {
    title: String(obj?.title || '코치 결과'),
    diagnosis: String(obj?.diagnosis || ''),
    scripts: scripts.slice(0, 3).map((s: any) => ({ title: String(s?.title || ''), text: String(s?.text || '') })),
    next: next.slice(0, 4).map((n: any) => String(n)),
    disclaimer: String(obj?.disclaimer || '본 결과는 자기관리 보조이며 의료/치료 목적이 아닙니다.'),
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = getBearer(ctx.request)
  if (!isAllowed(token, ctx.env)) return unauthorized('PRO token required')

  let payload: any
  try {
    payload = await ctx.request.json()
  } catch {
    return badRequest('invalid json')
  }

  const situation = String(payload?.situation || '').trim()
  if (!situation) return badRequest('situation required')

  try {
    const system = buildSystemPrompt()
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
      obj = { title: '코치 결과', diagnosis: content, scripts: [], next: [], disclaimer: '' }
    }

    const out = normalizeOut(obj)
    // 안전망: scripts 3개/next 4개 부족하면 채움
    while (out.scripts.length < 3) out.scripts.push({ title: '문장', text: '' })
    while (out.next.length < 4) out.next.push('')

    return json(out)
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, { status: 500 })
  }
}
