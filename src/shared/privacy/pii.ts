export type PiiType =
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'RRN'
  | 'CARD'
  | 'ACCOUNT'
  | 'ADDRESS'
  | 'HANDLE'
  | 'KAKAO'

export type PiiFinding = {
  type: PiiType
  match: string
  index: number
  severity: 1 | 2 | 3 | 4 | 5
}

type PatternDef = {
  type: PiiType
  re: RegExp
  severity: 1 | 2 | 3 | 4 | 5
  replaceWith: string
}

const PATTERNS: PatternDef[] = [
  { type: 'EMAIL', re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, severity: 5, replaceWith: '[이메일]' },
  { type: 'URL', re: /\bhttps?:\/\/[^\s]+/gi, severity: 4, replaceWith: '[링크]' },
  { type: 'URL', re: /\bwww\.[^\s]+/gi, severity: 4, replaceWith: '[링크]' },

  { type: 'PHONE', re: /\b(?:\+?82[- ]?)?0(?:10|11|16|17|18|19)[- ]?\d{3,4}[- ]?\d{4}\b/g, severity: 5, replaceWith: '[전화번호]' },
  { type: 'PHONE', re: /\b0(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[- ]?\d{3,4}[- ]?\d{4}\b/g, severity: 4, replaceWith: '[전화번호]' },

  { type: 'RRN', re: /\b\d{6}[- ]?[1-4]\d{6}\b/g, severity: 5, replaceWith: '[주민번호]' },
  { type: 'CARD', re: /\b(?:\d[ -]*?){13,16}\b/g, severity: 4, replaceWith: '[카드번호]' },
  { type: 'ACCOUNT', re: /\b\d{2,4}[- ]?\d{2,4}[- ]?\d{2,8}\b/g, severity: 3, replaceWith: '[계좌]' },

  { type: 'HANDLE', re: /(^|\s)@[a-zA-Z0-9_\.]{3,30}\b/g, severity: 2, replaceWith: ' [아이디]' },
  { type: 'KAKAO', re: /\bopen\.kakao\.com\/[^\s]+/gi, severity: 4, replaceWith: '[오픈채팅링크]' },
  { type: 'KAKAO', re: /\bkakaotalk\b|\b카톡\b|\b카카오톡\b/gi, severity: 2, replaceWith: '[메신저]' },

  { type: 'ADDRESS', re: /\b(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n]{0,20}(시|군|구|읍|면|동|로|길)[^\n]{0,20}\d{1,4}\b/g, severity: 4, replaceWith: '[주소]' },
  { type: 'ADDRESS', re: /\b(로|길)\s?\d{1,4}\b/g, severity: 2, replaceWith: '[주소]' },
]

export function scanPii(text: string): PiiFinding[] {
  if (!text) return []
  const findings: PiiFinding[] = []

  for (const p of PATTERNS) {
    let m: RegExpExecArray | null
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : (p.re.flags + 'g'))
    while ((m = re.exec(text)) !== null) {
      const match = (m[0] || '').trim()
      if (!match) continue
      findings.push({ type: p.type, match, index: m.index, severity: p.severity })
    }
  }

  const uniq = new Map<string, PiiFinding>()
  for (const f of findings) {
    const key = `${f.type}:${f.match}`
    if (!uniq.has(key)) uniq.set(key, f)
  }

  return [...uniq.values()].sort((a, b) => b.severity - a.severity)
}

export function maskPii(text: string): string {
  if (!text) return text
  let out = text
  for (const p of PATTERNS) {
    out = out.replace(p.re, (s) => {
      if (p.type === 'HANDLE') return s.replace(/@[a-zA-Z0-9_\.]{3,30}/, p.replaceWith)
      return p.replaceWith
    })
  }
  return out
}

export function riskScore(findings: PiiFinding[]): number {
  const raw = findings.reduce((acc, f) => acc + f.severity * 10, 0)
  return Math.min(100, raw)
}
