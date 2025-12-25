/** @jsxImportSource preact */
import { useMemo } from 'preact/hooks'
import type { AppState as DomainState, Entry, Person } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { buildReport, causeLabel, type PersonAggregate } from '../../shared/domain/report'

type Props = {
  domain: DomainState
  person: Person
  dispatch: (e: AppEvent) => void
  onClose: () => void
}

type WeeklyTrend = {
  weekLabel: string
  entries: number
  netWon: number
  avgMood: number
}

function getWeeklyTrends(entries: Entry[], hourlyRateWon: number): WeeklyTrend[] {
  const now = new Date()
  const weeks: WeeklyTrend[] = []

  for (let i = 0; i < 4; i++) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)
    const startStr = weekStart.toISOString().slice(0, 10)
    const endStr = weekEnd.toISOString().slice(0, 10)

    const weekEntries = entries.filter(e => e.date >= startStr && e.date <= endStr)

    if (weekEntries.length === 0) {
      weeks.push({ weekLabel: `${i + 1}주 전`, entries: 0, netWon: 0, avgMood: 0 })
      continue
    }

    let totalCost = 0
    let totalBenefit = 0
    let totalMood = 0

    for (const e of weekEntries) {
      const timeCost = (e.minutes / 60) * hourlyRateWon
      const boundaryPenalty = e.boundaryHit ? 15000 : 0
      const moodPenalty = e.moodDelta < 0 ? Math.abs(e.moodDelta) * 12000 : 0
      const reciprocityPenalty = e.reciprocity <= 2 ? (3 - e.reciprocity) * 7000 : 0
      totalCost += e.moneyWon + timeCost + boundaryPenalty + moodPenalty + reciprocityPenalty

      const moodBenefit = e.moodDelta > 0 ? e.moodDelta * 10000 : 0
      const reciprocityBenefit = e.reciprocity >= 4 ? (e.reciprocity - 3) * 6000 : 0
      totalBenefit += moodBenefit + reciprocityBenefit

      totalMood += e.moodDelta
    }

    weeks.push({
      weekLabel: i === 0 ? '이번 주' : `${i}주 전`,
      entries: weekEntries.length,
      netWon: Math.round(totalBenefit - totalCost),
      avgMood: Math.round((totalMood / weekEntries.length) * 10) / 10,
    })
  }

  return weeks.reverse()
}

const MOOD_EMOJI: Record<number, string> = {
  '-2': '😡',
  '-1': '😟',
  '0': '😐',
  '1': '🙂',
  '2': '😄',
}

export function PersonDetailPage({ domain, person, dispatch, onClose }: Props) {
  const personEntries = useMemo(
    () => domain.entries.filter(e => e.personId === person.id).sort((a, b) => b.date.localeCompare(a.date)),
    [domain.entries, person.id]
  )

  const report = useMemo(
    () => buildReport(domain, { personId: person.id }),
    [domain, person.id]
  )

  const personStats: PersonAggregate | undefined = report.people[0]

  const weeklyTrends = useMemo(
    () => getWeeklyTrends(personEntries, domain.settings.hourlyRateWon),
    [personEntries, domain.settings.hourlyRateWon]
  )

  const categoryLabel = person.category === 'work' ? '직장' : person.category === 'family' ? '가족' : '개인'

  return (
    <div class="modalOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div class="modal" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div class="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div class="h1">{person.name}</div>
            <div class="row" style={{ gap: 8, marginTop: 4 }}>
              <span class="pill">{categoryLabel}</span>
              {person.isClient && <span class="pill">클라이언트</span>}
              <span class="hint">등록일: {person.createdAt.slice(0, 10)}</span>
            </div>
          </div>
          <button class="btn subtle" onClick={onClose}>닫기</button>
        </div>

        {/* Stats Summary */}
        {personStats ? (
          <div class="stats" style={{ marginTop: 16, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div class="stat">
              <div class="hint">총 기록</div>
              <div class="big">{personStats.entries}건</div>
            </div>
            <div class="stat">
              <div class="hint">총 시간</div>
              <div class="big">{Math.round(personStats.minutes / 60)}시간</div>
            </div>
            <div class="stat">
              <div class="hint">순이익</div>
              <div class={`big ${personStats.netWon >= 0 ? 'ok' : 'danger'}`}>
                {personStats.netWon >= 0 ? '+' : ''}₩{personStats.netWon.toLocaleString()}
              </div>
            </div>
            <div class="stat">
              <div class="hint">ROI</div>
              <div class={`big ${personStats.roiPct >= 0 ? 'ok' : 'danger'}`}>
                {personStats.roiPct >= 0 ? '+' : ''}{personStats.roiPct}%
              </div>
            </div>
          </div>
        ) : (
          <div class="callout" style={{ marginTop: 16 }}>
            <div class="hint">아직 기록이 없습니다.</div>
          </div>
        )}

        {/* Key Indicators */}
        {personStats && (
          <div class="card" style={{ marginTop: 16 }}>
            <div class="h2">주요 지표</div>
            <div class="list" style={{ marginTop: 8, gap: 6 }}>
              <div class="row" style={{ justifyContent: 'space-between' }}>
                <span>평균 상호성</span>
                <span class={personStats.avgReciprocity >= 3 ? 'ok' : 'danger'}>
                  {personStats.avgReciprocity}/5
                </span>
              </div>
              <div class="row" style={{ justifyContent: 'space-between' }}>
                <span>평균 기분 변화</span>
                <span class={personStats.avgMoodDelta >= 0 ? 'ok' : 'danger'}>
                  {personStats.avgMoodDelta >= 0 ? '+' : ''}{personStats.avgMoodDelta}
                </span>
              </div>
              <div class="row" style={{ justifyContent: 'space-between' }}>
                <span>경계 침해</span>
                <span class={personStats.boundaryHits === 0 ? 'ok' : 'danger'}>
                  {personStats.boundaryHits}회
                </span>
              </div>
              <div class="row" style={{ justifyContent: 'space-between' }}>
                <span>주요 비용 원인</span>
                <span class="hint">{causeLabel(personStats.topCause)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Trend */}
        {weeklyTrends.some(w => w.entries > 0) && (
          <div class="card" style={{ marginTop: 16 }}>
            <div class="h2">주간 추이</div>
            <div class="grid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {weeklyTrends.map(w => (
                <div key={w.weekLabel} style={{ textAlign: 'center', padding: 8, background: 'var(--colorNeutralBackground2)', borderRadius: 'var(--borderRadiusMedium)' }}>
                  <div class="hint" style={{ fontSize: 'var(--fontSizeBase100)' }}>{w.weekLabel}</div>
                  {w.entries > 0 ? (
                    <>
                      <div style={{ fontWeight: 700, color: w.netWon >= 0 ? 'var(--colorStatusSuccessForeground1)' : 'var(--colorStatusDangerForeground1)' }}>
                        {w.netWon >= 0 ? '+' : ''}{Math.round(w.netWon / 1000)}k
                      </div>
                      <div class="hint">{w.entries}건</div>
                    </>
                  ) : (
                    <div class="hint">-</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div style={{ marginTop: 16 }}>
          <div class="row" style={{ justifyContent: 'space-between' }}>
            <div class="h2">최근 기록</div>
            <span class="hint">{personEntries.length}건</span>
          </div>
          {personEntries.length === 0 ? (
            <div class="hint" style={{ marginTop: 8 }}>기록이 없습니다.</div>
          ) : (
            <div class="list" style={{ marginTop: 8, maxHeight: 240, overflow: 'auto' }}>
              {personEntries.slice(0, 10).map(e => (
                <div key={e.id} class="listItem" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div class="row" style={{ justifyContent: 'space-between' }}>
                    <span class="hint">{e.date}</span>
                    <span>{MOOD_EMOJI[e.moodDelta] || '😐'}</span>
                  </div>
                  <div class="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <span>{e.minutes}분</span>
                    {e.moneyWon > 0 && <span>₩{e.moneyWon.toLocaleString()}</span>}
                    <span>상호성 {e.reciprocity}/5</span>
                    {e.boundaryHit && <span class="badge danger">경계 침해</span>}
                  </div>
                  {e.note && (
                    <div class="note" style={{ marginTop: 4 }}>{e.note}</div>
                  )}
                </div>
              ))}
              {personEntries.length > 10 && (
                <div class="hint" style={{ textAlign: 'center', padding: 8 }}>
                  +{personEntries.length - 10}건 더 있음
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div class="row" style={{ marginTop: 16, gap: 8 }}>
          <button
            class="btn primary"
            onClick={() => {
              // Close modal - user can use QuickLogBar on dashboard
              onClose()
            }}
          >
            닫기
          </button>
          <button
            class="btn subtle"
            onClick={() => {
              if (confirm(`"${person.name}" 님을 삭제하시겠습니까?\n\n관련 기록도 모두 삭제됩니다.`)) {
                dispatch({ type: 'PERSON_DELETE', personId: person.id })
                onClose()
              }
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
