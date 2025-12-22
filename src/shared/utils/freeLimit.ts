const STORAGE_KEY = 'free_coach_usage'
const DAILY_LIMIT = 3

type UsageData = {
  date: string // YYYY-MM-DD
  count: number
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function getUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayISO(), count: 0 }
    const data = JSON.parse(raw) as UsageData
    // 날짜가 오늘이 아니면 리셋
    if (data.date !== todayISO()) {
      return { date: todayISO(), count: 0 }
    }
    return data
  } catch {
    return { date: todayISO(), count: 0 }
  }
}

function saveUsage(data: UsageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** 무료 코치 사용 가능 여부 체크 */
export function checkFreeCoachLimit(): { allowed: boolean; remaining: number; usedToday: number } {
  const usage = getUsage()
  const remaining = Math.max(0, DAILY_LIMIT - usage.count)
  return {
    allowed: usage.count < DAILY_LIMIT,
    remaining,
    usedToday: usage.count,
  }
}

/** 무료 코치 사용 카운트 증가 */
export function incrementFreeCoachUsage(): void {
  const usage = getUsage()
  saveUsage({ date: todayISO(), count: usage.count + 1 })
}
