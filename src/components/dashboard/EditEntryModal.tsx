/** @jsxImportSource preact */
import { useState, useMemo } from 'preact/hooks'
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
    <div class="sheetOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div class="sheet" style={{ maxWidth: 480 }}>
        <div class="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div class="h2" style={{ margin: 0 }}>기록 수정</div>
            <div class="hint">{person?.name || '(unknown)'}</div>
          </div>
          <button class="btn" onClick={onClose}>취소</button>
        </div>

        <div class="grid" style={{ gap: 12 }}>
          <div class="qGroup">
            <div class="qLabel">날짜</div>
            <input class="input" type="date" value={date} onInput={(e) => setDate((e.currentTarget as HTMLInputElement).value)} />
          </div>

          <div class="row" style={{ gap: 12 }}>
            <div class="qGroup" style={{ flex: 1 }}>
              <div class="qLabel">시간 (분)</div>
              <input
                class="input"
                type="number"
                min={0}
                max={1440}
                value={minutes}
                onInput={(e) => setMinutes(Math.max(0, Math.min(1440, Number((e.currentTarget as HTMLInputElement).value) || 0)))}
              />
              <div class="hint danger" style={{ marginTop: 4 }}>= -₩{timeCostWon.toLocaleString()}</div>
            </div>

            <div class="qGroup" style={{ flex: 1 }}>
              <div class="qLabel">금액 (원)</div>
              <input
                class="input"
                type="number"
                min={0}
                max={100000000}
                value={moneyWon}
                onInput={(e) => setMoneyWon(Math.max(0, Math.min(100000000, Number((e.currentTarget as HTMLInputElement).value) || 0)))}
              />
            </div>
          </div>

          <div class="row" style={{ gap: 12 }}>
            <div class="qGroup" style={{ flex: 1 }}>
              <div class="qLabel">감정세</div>
              <div class="qButtons">
                {([-2, -1, 0, 1, 2] as const).map(v => (
                  <button class={`qBtn ${moodDelta === v ? 'on' : ''}`} onClick={() => setMoodDelta(v)}>
                    {v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`}
                  </button>
                ))}
              </div>
            </div>

            <div class="qGroup" style={{ flex: 1 }}>
              <div class="qLabel">상호성</div>
              <div class="qButtons">
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button class={`qBtn ${reciprocity === v ? 'on' : ''}`} onClick={() => setReciprocity(v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          <div class="qGroup">
            <div class="qLabel">경계 침해</div>
            <button class={`qBtn ${boundaryHit ? 'on danger' : ''}`} onClick={() => setBoundaryHit(!boundaryHit)}>
              {boundaryHit ? '선 넘음' : '정상'}
            </button>
          </div>

          <div class="qGroup">
            <div class="qLabel">메모</div>
            <textarea class="textarea" value={note} onInput={(e) => setNote((e.currentTarget as HTMLTextAreaElement).value)} />
          </div>

          <button class="btn primary" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  )
}
