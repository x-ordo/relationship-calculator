/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { AppState as DomainState, Entry } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { uid } from '../../shared/storage/state'
import { validateMinutes, validateMoneyWon } from '../../shared/utils/validation'

/** 프리셋 템플릿: 자주 쓰는 상황 빠른 입력 */
type Preset = {
  id: string
  label: string
  emoji: string
  minutes?: number
  moneyWon?: number
  moodDelta?: -2 | -1 | 0 | 1 | 2
  reciprocity?: 1 | 2 | 3 | 4 | 5
  boundaryHit?: boolean
}

const PRESETS: Preset[] = [
  { id: 'boundary', label: '선 넘음', emoji: '🚨', moodDelta: -2, reciprocity: 1, boundaryHit: true },
  { id: 'drain', label: '일방 소모', emoji: '🔋', moodDelta: -1, reciprocity: 2, boundaryHit: false },
  { id: 'neutral', label: '그냥저냥', emoji: '😐', moodDelta: 0, reciprocity: 3, boundaryHit: false },
  { id: 'mutual', label: '상호 이득', emoji: '🤝', moodDelta: 1, reciprocity: 5, boundaryHit: false },
  { id: 'energy', label: '에너지 충전', emoji: '⚡', moodDelta: 2, reciprocity: 5, boundaryHit: false },
]

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
  const hourlyRate = domain.settings.hourlyRateWon

  // Get selected person to check if it's a client (B2B)
  const selectedPerson = useMemo(() => people.find(p => p.id === personId), [people, personId])
  const isClient = selectedPerson?.isClient ?? false

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
  const [error, setError] = useState('')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingEntry, setPendingEntry] = useState<Entry | null>(null)

  /** 프리셋 적용 */
  const applyPreset = (preset: Preset) => {
    if (preset.minutes !== undefined) setMinutes(preset.minutes)
    if (preset.moneyWon !== undefined) setMoneyWon(preset.moneyWon)
    if (preset.moodDelta !== undefined) setMoodDelta(preset.moodDelta)
    if (preset.reciprocity !== undefined) setReciprocity(preset.reciprocity)
    if (preset.boundaryHit !== undefined) setBoundaryHit(preset.boundaryHit)
    setActivePreset(preset.id)
  }

  // Calculate time cost in Won
  const timeCostWon = useMemo(() => Math.round((minutes / 60) * hourlyRate), [minutes, hourlyRate])

  const canSave = hasPeople && !!personId

  /** 저장 버튼: validation 후 확인 모달 표시 */
  const save = () => {
    setError('')
    if (!canSave) return
    if (!people.some(p => p.id === personId)) {
      setError('선택한 사람이 존재하지 않습니다')
      return
    }

    // Validate minutes
    const minutesVal = validateMinutes(Number(minutes) || 0)
    if (!minutesVal.valid) {
      setError(minutesVal.error || '시간 입력 오류')
      return
    }

    // Validate money
    const moneyVal = validateMoneyWon(Number(moneyWon) || 0)
    if (!moneyVal.valid) {
      setError(moneyVal.error || '금액 입력 오류')
      return
    }

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
    setPendingEntry(entry)
    setConfirmOpen(true)
  }

  /** 확인 모달에서 "저장" 클릭 */
  const confirmSave = () => {
    if (!pendingEntry) return
    dispatch({ type: 'ENTRY_ADD', entry: pendingEntry })
    setSaved(true)
    setConfirmOpen(false)
    setPendingEntry(null)
    try { onSaved?.() } catch {}
    setBoundaryHit(false)
    setActivePreset(null)
    window.setTimeout(() => setSaved(false), 900)
  }

  /** 확인 모달에서 "취소" 클릭 */
  const cancelSave = () => {
    setConfirmOpen(false)
    setPendingEntry(null)
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
          {error && <div class="badge" style={{ borderColor: 'rgba(239,68,68,0.35)', color: 'var(--colorStatusDangerForeground1)' }}>오류</div>}
          <button class="btn primary" onClick={save} disabled={!canSave}>저장</button>
        </div>
      </div>

      {error && (
        <div class="callout danger" style={{ marginTop: 8, padding: '8px 12px' }}>
          {error}
        </div>
      )}

      {!hasPeople ? (
        <div class="callout danger" style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900 }}>사람이 없으면 기록도 없다.</div>
          <div class="hint">위에서 사람부터 추가해.</div>
        </div>
      ) : (
        <>
          {/* 프리셋 템플릿 */}
          <div class="qGroup" style={{ marginTop: 10 }}>
            <div class="qLabel">빠른 선택</div>
            <div class="qButtons" style={{ flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  class={`qBtn ${activePreset === p.id ? 'on' : ''}`}
                  onClick={() => applyPreset(p)}
                  title={p.label}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div class="row" style={{ marginTop: 10 }}>
            <div class="qGroup">
              <div class="qLabel">대상 {isClient && <span class="pillMini" style={{ marginLeft: 4 }}>업무</span>}</div>
              <select value={personId} onChange={(e) => setPersonId((e.currentTarget as HTMLSelectElement).value)}>
                <option value="">사람 선택</option>
                {people.map(p => <option value={p.id}>{p.name}{p.isClient ? ' (클라이언트)' : ''}</option>)}
              </select>
            </div>

            <div class="qGroup">
              <div class="qLabel">시간 (인건비)</div>
              <div class="qButtons">
                {minutePresets.map(m => (
                  <button class={`qBtn ${minutes === m ? 'on' : ''}`} onClick={() => setMinutes(m)}>{m}분</button>
                ))}
                <input
                  class="input qInput"
                  type="number"
                  min={0}
                  max={1440}
                  value={minutes}
                  onInput={(e) => {
                    const val = Number((e.currentTarget as HTMLInputElement).value)
                    setMinutes(Math.max(0, Math.min(1440, val || 0)))
                  }}
                />
              </div>
              <div class="hint danger" style={{ marginTop: 4 }}>
                = -₩{timeCostWon.toLocaleString()} 환산
              </div>
            </div>

            <div class="qGroup">
              <div class="qLabel">돈 (직접 비용)</div>
              <div class="qButtons">
                {moneyPresets.map(w => (
                  <button class={`qBtn ${moneyWon === w ? 'on' : ''}`} onClick={() => setMoneyWon(w)}>{w === 0 ? '0' : `₩${(w/1000).toFixed(0)}k`}</button>
                ))}
                <input
                  class="input qInput"
                  type="number"
                  min={0}
                  max={100000000}
                  value={moneyWon}
                  onInput={(e) => {
                    const val = Number((e.currentTarget as HTMLInputElement).value)
                    setMoneyWon(Math.max(0, Math.min(100000000, val || 0)))
                  }}
                />
              </div>
            </div>
          </div>

          <div class="row" style={{ marginTop: 10, alignItems: 'flex-start' }}>
            <div class="qGroup">
              <div class="qLabel">감정세 (VAT)</div>
              <div class="qButtons">
                {([-2, -1, 0, 1, 2] as const).map(v => (
                  <button class={`qBtn ${moodDelta === v ? 'on' : ''}`} onClick={() => setMoodDelta(v)}>{v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`}</button>
                ))}
              </div>
              <div class="hint" style={{ marginTop: 6 }}>-2 멘탈 박살 … +2 에너지 회복</div>
            </div>

            <div class="qGroup">
              <div class="qLabel">투자 효율</div>
              <div class="qButtons">
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button class={`qBtn ${reciprocity === v ? 'on' : ''}`} onClick={() => setReciprocity(v)}>{v}</button>
                ))}
              </div>
              <div class="hint" style={{ marginTop: 6 }}>1 손해만 … 5 상호 이득</div>
            </div>

            <div class="qGroup">
              <div class="qLabel">추가 비용</div>
              <div class="qButtons">
                <button class={`qBtn ${boundaryHit ? 'on danger' : ''}`} onClick={() => setBoundaryHit(!boundaryHit)}>
                  {boundaryHit ? '선 넘음' : '정상'}
                </button>
              </div>
              <div class="hint" style={{ marginTop: 6 }}>경계 침범 = 추가 손실</div>
            </div>
          </div>
        </>
      )}

      {/* 확인 모달 */}
      {confirmOpen && pendingEntry && (
        <div class="sheetOverlay" onClick={(e) => { if (e.target === e.currentTarget) cancelSave() }}>
          <div class="sheet" style={{ maxWidth: 400 }}>
            <div class="h2" style={{ margin: 0 }}>기록 확인</div>
            <div class="hint" style={{ marginTop: 4 }}>아래 내용으로 저장할까요?</div>

            <div class="card" style={{ marginTop: 12, background: 'var(--colorNeutralBackground3)' }}>
              <div style={{ fontWeight: 700 }}>{people.find(p => p.id === pendingEntry.personId)?.name || '(unknown)'}</div>
              <div class="hint" style={{ marginTop: 6 }}>
                {pendingEntry.minutes}분 · ₩{pendingEntry.moneyWon.toLocaleString()} ·
                기분 {pendingEntry.moodDelta > 0 ? '+' : ''}{pendingEntry.moodDelta} ·
                상호성 {pendingEntry.reciprocity}
                {pendingEntry.boundaryHit && <span class="pillMini danger" style={{ marginLeft: 6 }}>경계 침해</span>}
              </div>
              <div class="hint danger" style={{ marginTop: 4 }}>
                시간 비용: -₩{Math.round((pendingEntry.minutes / 60) * hourlyRate).toLocaleString()}
              </div>
            </div>

            <div class="row" style={{ marginTop: 14, justifyContent: 'flex-end', gap: 8 }}>
              <button class="btn" onClick={cancelSave}>취소</button>
              <button class="btn primary" onClick={confirmSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
