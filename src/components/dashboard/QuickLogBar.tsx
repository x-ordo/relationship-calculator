/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { AppState as DomainState, Entry } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { uid } from '../../shared/storage/state'

type Props = {
  domain: DomainState
  dispatch: (e: AppEvent) => void
  personId: string
  setPersonId: (id: string) => void
  /** called after a successful save (useful for sheets) */
  onSaved?: () => void
  /** compact layout (for bottom sheet) */
  compact?: boolean
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function QuickLogBar({ domain, dispatch, personId, setPersonId, onSaved, compact }: Props) {
  const people = domain.people
  const hasPeople = people.length > 0

  // If user hasn't selected a person yet, default to first person.
  useEffect(() => {
    if (!personId && people[0]) setPersonId(people[0].id)
  }, [personId, people.length])

  const minutePresets = useMemo(() => [10, 30, 60, 120], [])
  const moneyPresets = useMemo(() => [0, 10000, 30000, 50000], [])

  const [minutes, setMinutes] = useState(30)
  const [moneyWon, setMoneyWon] = useState(0)
  const [moodDelta, setMoodDelta] = useState<-2 | -1 | 0 | 1 | 2>(0)
  const [reciprocity, setReciprocity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [boundaryHit, setBoundaryHit] = useState(false)
  const [saved, setSaved] = useState(false)

  const canSave = hasPeople && !!personId

  const save = () => {
    if (!canSave) return
    if (!people.some(p => p.id === personId)) return
    const entry: Entry = {
      id: uid('e'),
      personId,
      date: todayISO(),
      minutes: Math.max(0, Number(minutes) || 0),
      moneyWon: Math.max(0, Number(moneyWon) || 0),
      moodDelta,
      reciprocity,
      boundaryHit,
      note: '',
    }
    dispatch({ type: 'ENTRY_ADD', entry })
    setSaved(true)
    try { onSaved?.() } catch {}
    setBoundaryHit(false)
    window.setTimeout(() => setSaved(false), 900)
  }

  return (
    <div class={`quickbar ${compact ? 'compact' : ''}`} style={{ marginTop: compact ? 0 : 12 }}>
      <div class="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div class="h2">오늘 10초 기록</div>
          <div class="hint">길게 쓰지 마. 숫자만 찍고 끝. (오늘 날짜로 저장)</div>
        </div>
        <div class="row">
          {saved && <div class="badge" style={{ borderColor: 'rgba(52,211,153,0.35)', color: 'var(--ok)' }}>저장됨</div>}
          <button class="btn primary" onClick={save} disabled={!canSave}>저장</button>
        </div>
      </div>

      {!hasPeople ? (
        <div class="callout danger" style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900 }}>사람이 없으면 기록도 없다.</div>
          <div class="hint">위에서 사람부터 추가해.</div>
        </div>
      ) : (
        <>
          <div class="row" style={{ marginTop: 10 }}>
            <select value={personId} onChange={(e) => setPersonId((e.currentTarget as HTMLSelectElement).value)}>
              <option value="">사람 선택</option>
              {people.map(p => <option value={p.id}>{p.name}</option>)}
            </select>

            <div class="qGroup">
              <div class="qLabel">시간</div>
              <div class="qButtons">
                {minutePresets.map(m => (
                  <button class={`qBtn ${minutes === m ? 'on' : ''}`} onClick={() => setMinutes(m)}>{m}분</button>
                ))}
                <input
                  class="input qInput"
                  type="number"
                  min={0}
                  value={minutes}
                  onInput={(e) => setMinutes(Number((e.currentTarget as HTMLInputElement).value))}
                />
              </div>
            </div>

            <div class="qGroup">
              <div class="qLabel">돈</div>
              <div class="qButtons">
                {moneyPresets.map(w => (
                  <button class={`qBtn ${moneyWon === w ? 'on' : ''}`} onClick={() => setMoneyWon(w)}>{w === 0 ? '0' : `₩${(w/1000).toFixed(0)}k`}</button>
                ))}
                <input
                  class="input qInput"
                  type="number"
                  min={0}
                  value={moneyWon}
                  onInput={(e) => setMoneyWon(Number((e.currentTarget as HTMLInputElement).value))}
                />
              </div>
            </div>
          </div>

          <div class="row" style={{ marginTop: 10, alignItems: 'flex-start' }}>
            <div class="qGroup">
              <div class="qLabel">기분</div>
              <div class="qButtons">
                {([-2, -1, 0, 1, 2] as const).map(v => (
                  <button class={`qBtn ${moodDelta === v ? 'on' : ''}`} onClick={() => setMoodDelta(v)}>{v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`}</button>
                ))}
              </div>
              <div class="hint" style={{ marginTop: 6 }}>-2 박살 … +2 회복</div>
            </div>

            <div class="qGroup">
              <div class="qLabel">상호성</div>
              <div class="qButtons">
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button class={`qBtn ${reciprocity === v ? 'on' : ''}`} onClick={() => setReciprocity(v)}>{v}</button>
                ))}
              </div>
              <div class="hint" style={{ marginTop: 6 }}>1 거의 없음 … 5 매우 좋음</div>
            </div>

            <div class="qGroup">
              <div class="qLabel">경계</div>
              <div class="qButtons">
                <button class={`qBtn ${boundaryHit ? 'on danger' : ''}`} onClick={() => setBoundaryHit(!boundaryHit)}>
                  {boundaryHit ? '침해 O' : '침해 X'}
                </button>
              </div>
              <div class="hint" style={{ marginTop: 6 }}>한 번이라도 선 넘었으면 O</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
