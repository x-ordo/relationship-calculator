/** @jsxImportSource preact */
export function QuickLogFab({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button class={`fab ${disabled ? 'disabled' : ''}`} onClick={onClick} disabled={!!disabled} aria-label="빠른 기록">
      + 기록
    </button>
  )
}
