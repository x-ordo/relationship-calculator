import { Button, Dialog, DialogSurface, DialogBody } from '@fluentui/react-components'
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
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className="sheet">
        <DialogBody>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div className="h2" style={{ margin: 0 }}>오늘 10초 기록</div>
              <div className="hint">한 손으로 끝내. 저장하면 자동으로 닫힘.</div>
            </div>
            <Button onClick={onClose}>닫기</Button>
          </div>

          <QuickLogBar
            domain={domain}
            dispatch={dispatch}
            personId={personId}
            setPersonId={setPersonId}
            compact
            onSaved={onClose}
          />
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
