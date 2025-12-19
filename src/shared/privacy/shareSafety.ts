import { scanPii, riskScore, type PiiFinding } from './pii'

export type ChecklistItem = {
  id: string
  label: string
  must: boolean
}

export const SHARE_CHECKLIST: ChecklistItem[] = [
  { id: 'no_realname', label: '실명/회사/학교/부서명 없음', must: true },
  { id: 'no_contact', label: '전화번호/이메일/메신저ID 없음', must: true },
  { id: 'no_address', label: '주소/동네/건물/상세 위치 없음', must: true },
  { id: 'no_links', label: '링크(오픈채팅/프로필/URL) 없음', must: true },
  { id: 'no_ids', label: '주민번호/카드/계좌 등 식별정보 없음', must: true },
  { id: 'mask_people', label: '상대는 “A/B/C”로 표기', must: false },
  { id: 'keep_general', label: '구체 날짜/장소/회사 사건 등은 일반화', must: false },
]

export type ShareSafetyReport = {
  findings: PiiFinding[]
  score: number
  level: 'SAFE' | 'WARN' | 'DANGER'
  summary: string
}

export function buildShareSafetyReport(textSources: string[]): ShareSafetyReport {
  const text = (textSources || []).filter(Boolean).join('\n')
  const findings = scanPii(text)
  const score = riskScore(findings)

  let level: ShareSafetyReport['level'] = 'SAFE'
  if (score >= 60) level = 'DANGER'
  else if (score >= 20) level = 'WARN'

  const summary =
    level === 'DANGER'
      ? '위험. 지금 공유하면 “식별/연락”으로 이어질 확률이 큼.'
      : level === 'WARN'
        ? '주의. 일부 식별정보가 섞였을 수 있음. 마스킹 확인.'
        : '안전. 그래도 마지막으로 한 번만 확인.'

  return { findings, score, level, summary }
}

export function formatFinding(f: PiiFinding) {
  const label: Record<string, string> = {
    EMAIL: '이메일',
    PHONE: '전화번호',
    URL: '링크',
    RRN: '주민번호(의심)',
    CARD: '카드번호(의심)',
    ACCOUNT: '계좌(의심)',
    ADDRESS: '주소(의심)',
    HANDLE: '아이디(@)',
    KAKAO: '메신저/오픈채팅',
  }
  return `${label[f.type] ?? f.type}: ${f.match}`
}
