import type { AppState, Entry, Person } from '../storage/state'

/** JSON 백업 내보내기 */
export function exportToJson(state: AppState): string {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    people: state.people,
    entries: state.entries,
  }
  return JSON.stringify(backup, null, 2)
}

/** CSV 내보내기 (기록만) */
export function exportToCsv(state: AppState): string {
  const headers = ['id', 'personId', 'personName', 'date', 'minutes', 'moneyWon', 'moodDelta', 'reciprocity', 'boundaryHit', 'note']
  const peopleMap = new Map(state.people.map(p => [p.id, p.name]))

  const rows = state.entries.map(e => [
    e.id,
    e.personId,
    peopleMap.get(e.personId) || '(unknown)',
    e.date,
    e.minutes,
    e.moneyWon,
    e.moodDelta,
    e.reciprocity,
    e.boundaryHit ? '1' : '0',
    `"${(e.note || '').replace(/"/g, '""')}"`,
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

/** JSON 백업 가져오기 */
export function importFromJson(json: string): { settings: AppState['settings']; people: Person[]; entries: Entry[] } | null {
  try {
    const data = JSON.parse(json)
    if (!data || typeof data !== 'object') return null
    if (!data.settings || !Array.isArray(data.people) || !Array.isArray(data.entries)) return null

    // 기본 검증
    const settings = data.settings as AppState['settings']
    const people = data.people as Person[]
    const entries = data.entries as Entry[]

    // 필수 필드 검증
    for (const p of people) {
      if (!p.id || typeof p.name !== 'string') return null
    }
    for (const e of entries) {
      if (!e.id || !e.personId || !e.date) return null
    }

    return { settings, people, entries }
  } catch {
    return null
  }
}

/** 파일 다운로드 트리거 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
