import { useMemo } from 'react'
import { Card } from '@fluentui/react-components'
import type { AppState as DomainState } from '../../shared/storage/state'
import { generateInsights, type Insight } from '../../shared/domain/insights'

type Props = {
  domain: DomainState
}

function InsightCard({ insight }: { insight: Insight }) {
  const bgColor = insight.type === 'warning'
    ? 'var(--colorStatusDangerBackground1)'
    : insight.type === 'success'
    ? 'var(--colorStatusSuccessBackground1)'
    : 'var(--colorSubtleBackgroundHover)'

  const borderColor = insight.type === 'warning'
    ? 'var(--colorStatusDangerForeground1)'
    : insight.type === 'success'
    ? 'var(--colorStatusSuccessForeground1)'
    : 'var(--colorNeutralStroke1)'

  return (
    <Card
      style={{
        background: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        padding: '10px 12px',
      }}
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 20 }}>{insight.icon}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{insight.title}</div>
          <div className="hint" style={{ marginTop: 2 }}>{insight.description}</div>
        </div>
      </div>
    </Card>
  )
}

export function InsightBanner({ domain }: Props) {
  const insights = useMemo(() => generateInsights(domain), [domain])

  if (insights.length === 0) return null

  return (
    <div style={{ marginBottom: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="h2" style={{ margin: 0 }}>이번 주 인사이트</div>
        <div className="hint">{insights.length}개</div>
      </div>
      <div className="grid" style={{ gap: 8 }}>
        {insights.map(i => <InsightCard key={i.id} insight={i} />)}
      </div>
    </div>
  )
}
