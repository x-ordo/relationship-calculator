/** @jsxImportSource preact */
import { QuickLogBar } from './QuickLogBar'
import type { AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'

type Props = {
  open: boolean
  onClose: () => void
  domain: DomainState
  dispatch: (e: AppEvent) => void
  personId: string
  setPersonId: (id: string) => void
}

export function QuickLogSheet({ open, onClose, domain, dispatch, personId, setPersonId }: Props) {
  if (!open) return null

  return (
    <div class="sheetOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div class="sheet">
        <div class="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div class="h2" style={{ margin: 0 }}>오늘 10초 기록</div>
            <div class="hint">한 손으로 끝내. 저장하면 자동으로 닫힘.</div>
          </div>
          <button class="btn" onClick={onClose}>닫기</button>
        </div>

        <QuickLogBar
          domain={domain}
          dispatch={dispatch}
          personId={personId}
          setPersonId={setPersonId}
          compact
          onSaved={onClose}
        />
      </div>
    </div>
  )
}
