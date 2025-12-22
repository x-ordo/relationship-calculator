/** @jsxImportSource preact */
import type { Tab } from '../../state/ui'

type Props = {
  tab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'coach', label: '코치', icon: '⚖️' },
  { id: 'share', label: '공유', icon: '🎴' },
  { id: 'pro', label: 'PRO', icon: '⭐' },
]

export function BottomNav({ tab, onTabChange }: Props) {
  return (
    <nav class="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.id}
          class={`bottom-nav-item ${tab === t.id ? 'active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span class="bottom-nav-icon">{t.icon}</span>
          <span class="bottom-nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
