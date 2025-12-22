import type { AppState, Entry } from '../storage/state'

export type Insight = {
  id: string
  type: 'warning' | 'info' | 'success'
  icon: string
  title: string
  description: string
}

function getEntriesInRange(entries: Entry[], days: number): Entry[] {
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return entries.filter(e => e.date >= cutoffStr)
}

/** 주간 인사이트 생성 */
export function generateInsights(state: AppState): Insight[] {
  const insights: Insight[] = []
  const weekEntries = getEntriesInRange(state.entries, 7)
  const prevWeekEntries = getEntriesInRange(state.entries, 14).filter(
    e => !weekEntries.some(w => w.id === e.id)
  )

  if (weekEntries.length === 0) {
    insights.push({
      id: 'no_data',
      type: 'info',
      icon: '📝',
      title: '이번 주 기록 없음',
      description: '기록을 시작하면 인사이트가 생깁니다.',
    })
    return insights
  }

  // 1. 경계 침해 체크
  const boundaryHits = weekEntries.filter(e => e.boundaryHit).length
  if (boundaryHits >= 3) {
    insights.push({
      id: 'boundary_high',
      type: 'warning',
      icon: '🚨',
      title: `이번 주 경계 침해 ${boundaryHits}회`,
      description: '손절 or 규칙 정하기가 필요해 보입니다.',
    })
  } else if (boundaryHits > 0) {
    insights.push({
      id: 'boundary_some',
      type: 'info',
      icon: '⚠️',
      title: `경계 침해 ${boundaryHits}회`,
      description: '누가, 왜 선을 넘었는지 점검해보세요.',
    })
  }

  // 2. 감정 소모 체크
  const avgMood = weekEntries.reduce((sum, e) => sum + e.moodDelta, 0) / weekEntries.length
  if (avgMood <= -1) {
    insights.push({
      id: 'mood_drain',
      type: 'warning',
      icon: '😞',
      title: '감정 소모 심함',
      description: `평균 기분 변화 ${avgMood.toFixed(1)}. 에너지 회복이 필요합니다.`,
    })
  } else if (avgMood >= 1) {
    insights.push({
      id: 'mood_good',
      type: 'success',
      icon: '😊',
      title: '좋은 한 주!',
      description: `평균 기분 변화 +${avgMood.toFixed(1)}. 이 관계 유지하세요.`,
    })
  }

  // 3. 시간 투자 체크
  const totalMinutes = weekEntries.reduce((sum, e) => sum + e.minutes, 0)
  const hourlyRate = state.settings.timeValuePerHourWon
  const timeCost = Math.round((totalMinutes / 60) * hourlyRate)
  if (totalMinutes >= 600) { // 10시간 이상
    insights.push({
      id: 'time_high',
      type: 'info',
      icon: '⏰',
      title: `이번 주 ${Math.round(totalMinutes / 60)}시간 투자`,
      description: `시간 비용 약 ₩${timeCost.toLocaleString()}. 투자 대비 효율 점검 필요.`,
    })
  }

  // 4. 상호성 체크
  const avgReciprocity = weekEntries.reduce((sum, e) => sum + e.reciprocity, 0) / weekEntries.length
  if (avgReciprocity <= 2) {
    insights.push({
      id: 'reciprocity_low',
      type: 'warning',
      icon: '⚖️',
      title: '일방적 관계 경고',
      description: `평균 상호성 ${avgReciprocity.toFixed(1)}/5. 받는 것보다 주는 게 많습니다.`,
    })
  }

  // 5. 주간 비교 (이전 주 대비)
  if (prevWeekEntries.length > 0) {
    const prevBoundary = prevWeekEntries.filter(e => e.boundaryHit).length
    if (boundaryHits > prevBoundary && boundaryHits >= 2) {
      insights.push({
        id: 'boundary_increase',
        type: 'warning',
        icon: '📈',
        title: '경계 침해 증가',
        description: `지난주 ${prevBoundary}회 → 이번 주 ${boundaryHits}회. 패턴 확인 필요.`,
      })
    }
  }

  return insights.slice(0, 3) // 최대 3개
}
