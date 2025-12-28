import { useState, useMemo } from 'react'
import { Button, Dialog, DialogSurface, DialogBody, Textarea } from '@fluentui/react-components'
import type { Entry, AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'

type Props = {
  entry: Entry
  domain: DomainState
  dispatch: (e: AppEvent) => void
  onClose: () => void
}

export function EditEntryModal({ entry, domain, dispatch, onClose }: Props) {
  const [date, setDate] = useState(entry.date)
  const [minutes, setMinutes] = useState(entry.minutes)
  const [moneyWon, setMoneyWon] = useState(entry.moneyWon)
  const [moodDelta, setMoodDelta] = useState(entry.moodDelta)
  const [reciprocity, setReciprocity] = useState(entry.reciprocity)
  const [boundaryHit, setBoundaryHit] = useState(entry.boundaryHit)
  const [note, setNote] = useState(entry.note || '')

  const person = useMemo(() => domain.people.find(p => p.id === entry.personId), [domain.people, entry.personId])
  const hourlyRate = domain.settings.hourlyRateWon
  const timeCostWon = useMemo(() => Math.round((minutes / 60) * hourlyRate), [minutes, hourlyRate])

  const handleSave = () => {
    dispatch({
      type: 'ENTRY_EDIT',
      entryId: entry.id,
      patch: { date, minutes, moneyWon, moodDelta, reciprocity, boundaryHit, note: note.trim() },
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className="sheet" style={{ maxWidth: 480 }}>
        <DialogBody>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="h2" style={{ margin: 0 }}>기록 수정</div>
              <div className="hint">{person?.name || '(unknown)'}</div>
            </div>
            <Button onClick={onClose}>취소</Button>
          </div>

          <div className="grid" style={{ gap: 12 }}>
            <div className="qGroup">
              <div className="qLabel">날짜</div>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
            </div>

            <div className="row" style={{ gap: 12 }}>
              <div className="qGroup" style={{ flex: 1 }}>
                <div className="qLabel">시간 (분)</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(1440, Number(e.currentTarget.value) || 0)))}
                />
                <div className="hint danger" style={{ marginTop: 4 }}>= -₩{timeCostWon.toLocaleString()}</div>
              </div>

              <div className="qGroup" style={{ flex: 1 }}>
                <div className="qLabel">금액 (원)</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100000000}
                  value={moneyWon}
                  onChange={(e) => setMoneyWon(Math.max(0, Math.min(100000000, Number(e.currentTarget.value) || 0)))}
                />
              </div>
            </div>

            <div className="row" style={{ gap: 12 }}>
              <div className="qGroup" style={{ flex: 1 }}>
                <div className="qLabel">감정세</div>
                <div className="qButtons">
                  {([-2, -1, 0, 1, 2] as const).map(v => (
                    <button key={v} className={`qBtn ${moodDelta === v ? 'on' : ''}`} onClick={() => setMoodDelta(v)}>
                      {v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qGroup" style={{ flex: 1 }}>
                <div className="qLabel">상호성</div>
                <div className="qButtons">
                  {([1, 2, 3, 4, 5] as const).map(v => (
                    <button key={v} className={`qBtn ${reciprocity === v ? 'on' : ''}`} onClick={() => setReciprocity(v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="qGroup">
              <div className="qLabel">경계 침해</div>
              <button className={`qBtn ${boundaryHit ? 'on danger' : ''}`} onClick={() => setBoundaryHit(!boundaryHit)}>
                {boundaryHit ? '선 넘음' : '정상'}
              </button>
            </div>

            <div className="qGroup">
              <div className="qLabel">메모</div>
              <Textarea value={note} onChange={(_, data) => setNote(data.value)} />
            </div>

            <Button appearance="primary" onClick={handleSave}>저장</Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
