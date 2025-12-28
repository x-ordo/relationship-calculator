import { Button } from '@fluentui/react-components'

export function QuickLogFab({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      className={`fab ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={!!disabled}
      aria-label="빠른 기록"
      appearance="primary"
    >
      + 기록
    </Button>
  )
}
