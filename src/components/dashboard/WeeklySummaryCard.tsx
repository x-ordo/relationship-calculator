import { useMemo } from 'react'
import { Badge, Card } from '@fluentui/react-components'
import type { AppState as DomainState } from '../../shared/storage/state'
import { buildReport } from '../../shared/domain/report'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function WeeklySummaryCard({ domain }: { domain: DomainState }) {
  const { week, prev, label } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)

    const prevEnd = new Date()
    prevEnd.setDate(end.getDate() - 7)
    const prevStart = new Date()
    prevStart.setDate(end.getDate() - 13)

    const weekRange = { start: isoDate(start), end: isoDate(end), label: '지난 7일' }
    const prevRange = { start: isoDate(prevStart), end: isoDate(prevEnd), label: '이전 7일' }

    return {
      week: buildReport(domain, { range: weekRange }),
      prev: buildReport(domain, { range: prevRange }),
      label: `${weekRange.start} ~ ${weekRange.end}`,
    }
  }, [domain])

  const hours = Math.round((week.totals.minutes / 60) * 10) / 10
  const deltaLoss = week.totals.netLossWon - prev.totals.netLossWon
  const deltaText = deltaLoss === 0
    ? '변화 없음'
    : (deltaLoss < 0 ? `▼ ₩${Math.abs(deltaLoss).toLocaleString()} 개선` : `▲ ₩${deltaLoss.toLocaleString()} 악화`)

  const hasData = week.totals.entries > 0

  return (
    <Card className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h2">주간 요약</div>
          <div className="hint">{label}</div>
        </div>
        <Badge color={deltaLoss > 0 ? 'danger' : 'success'} appearance="filled">
          {deltaText}
        </Badge>
      </div>

      {!hasData && (
        <div className="callout" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 950 }}>이번 주 기록 0개</div>
          <div className="hint">오늘 10초 기록 1번만 찍으면, 다음 주부터 '패턴'이 보인다.</div>
        </div>
      )}

      {hasData && (
        <div className="stats" style={{ marginTop: 12 }}>
          <div className="stat">
            <div className="hint">손실</div>
            <div className="big danger">₩{week.totals.netLossWon.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="hint">시간</div>
            <div className="big">{hours}h</div>
          </div>
          <div className="stat">
            <div className="hint">원인 1위</div>
            <div className="big">{week.topCauseLabel}</div>
          </div>
        </div>
      )}

      {hasData && (
        <div className="callout" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 950 }}>손해 1위: <span style={{ color: 'var(--accent)' }}>{week.topPersonLabel}</span></div>
          <div className="hint">핵심: {week.topCauseLabel} 한 가지만 막아도 손실이 줄어든다.</div>
        </div>
      )}
    </Card>
  )
}
