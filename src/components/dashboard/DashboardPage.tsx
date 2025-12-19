/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { uid } from '../../shared/storage/state'
import { buildReport, causeLabel } from '../../shared/domain/report'
import { QuickLogBar } from './QuickLogBar'
import { QuickLogSheet } from './QuickLogSheet'
import { QuickLogFab } from './QuickLogFab'
import { WeeklySummaryCard } from './WeeklySummaryCard'
import {
  validatePersonName,
  validateEntry,
  validateMonth,
} from '../../shared/utils/validation'

export function DashboardPage({ domain, dispatch }: { domain: DomainState, dispatch: (e: AppEvent) => void }) {
  const [newPersonName, setNewPersonName] = useState('')
  const [personNameError, setPersonNameError] = useState('')
  const [entryPersonId, setEntryPersonId] = useState('')
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [entryMinutes, setEntryMinutes] = useState(60)
  const [entryMoney, setEntryMoney] = useState(0)
  const [moodDelta, setMoodDelta] = useState<-2 | -1 | 0 | 1 | 2>(0)
  const [reciprocity, setReciprocity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [boundaryHit, setBoundaryHit] = useState(false)
  const [note, setNote] = useState('')
  const [entryError, setEntryError] = useState('')
  const [month, setMonth] = useState('') // YYYY-MM
  const [monthError, setMonthError] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)

  const report = useMemo(() => {
    const monthValidation = validateMonth(month)
    if (!monthValidation.valid) return buildReport(domain)
    return buildReport(domain, month ? { month } : undefined)
  }, [domain, month])

  const handleMonthChange = (value: string) => {
    setMonth(value)
    const validation = validateMonth(value)
    setMonthError(validation.valid ? '' : validation.error || '')
  }

  const addPerson = () => {
    const validation = validatePersonName(newPersonName)
    if (!validation.valid) {
      setPersonNameError(validation.error || '')
      return
    }
    setPersonNameError('')
    const name = newPersonName.trim()
    const p = { id: uid('p'), name, createdAt: new Date().toISOString() }
    dispatch({ type: 'PERSON_ADD', person: p })
    setNewPersonName('')
    if (!entryPersonId) setEntryPersonId(p.id)
  }

  const addEntry = () => {
    const validation = validateEntry({
      personId: entryPersonId,
      date: entryDate,
      minutes: entryMinutes,
      moneyWon: entryMoney,
      note,
    })
    if (!validation.valid) {
      setEntryError(validation.error || '')
      return
    }
    if (!domain.people.some(p => p.id === entryPersonId)) {
      setEntryError('선택한 사람이 존재하지 않습니다')
      return
    }
    setEntryError('')
    const e = {
      id: uid('e'),
      personId: entryPersonId,
      date: entryDate,
      minutes: Math.max(0, Number(entryMinutes) || 0),
      moneyWon: Math.max(0, Number(entryMoney) || 0),
      moodDelta,
      reciprocity,
      boundaryHit,
      note: note.trim(),
    }
    dispatch({ type: 'ENTRY_ADD', entry: e })
    setNote('')
    setBoundaryHit(false)
  }

  const removeEntry = (id: string) => {
    dispatch({ type: 'ENTRY_DELETE', entryId: id })
  }

  const removePerson = (id: string) => {
    const people = domain.people.filter(p => p.id !== id)
    const entries = domain.entries.filter(e => e.personId !== id)
    dispatch({ type: 'PERSON_DELETE', personId: id })
    if (entryPersonId === id) setEntryPersonId('')
  }

  return (
    <div class="panel">
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div class="h1">대시보드</div>
          <div class="hint">사람/상황을 기록하면, 손익과 원인이 자동으로 뽑힌다.</div>
        </div>
        <div>
          <div class="row">
            <input class="input small" placeholder="YYYY-MM (예: 2025-12)" value={month} onInput={(e) => handleMonthChange((e.currentTarget as HTMLInputElement).value)} />
            <button class="btn" onClick={() => { setMonth(''); setMonthError(''); }}>전체</button>
          </div>
          {monthError && <div class="hint danger" style={{ marginTop: 4 }}>{monthError}</div>}
        </div>
      </div>

      <QuickLogBar
        domain={domain}
        dispatch={dispatch}
        personId={entryPersonId}
        setPersonId={setEntryPersonId}
      />

      <WeeklySummaryCard domain={domain} />

      <div class="grid cols-2" style={{ marginTop: 14 }}>
        <div class="card">
          <div class="h2">사람 추가</div>
          <div class="row" style={{ marginTop: 10 }}>
            <input class="input" placeholder="이름/호칭 (공유 시 익명화 가능)" value={newPersonName} onInput={(e) => { setNewPersonName((e.currentTarget as HTMLInputElement).value); setPersonNameError(''); }} />
            <button class="btn primary" onClick={addPerson}>추가</button>
          </div>
          {personNameError && <div class="hint danger" style={{ marginTop: 6 }}>{personNameError}</div>}
          <div class="hint" style={{ marginTop: 10 }}>
            팁: 공유용 카드에는 기본으로 A/B/C로 바꿀 수 있음.
          </div>

          <div class="h2" style={{ marginTop: 18 }}>사람 목록</div>
          <div class="list" style={{ marginTop: 10 }}>
            {domain.people.length === 0 && <div class="hint">비어있음. 사람 1명 추가하고 ‘오늘 10초 기록’부터.</div>}
            {domain.people.map(p => (
              <div class="listItem">
                <div>
                  <div style={{ fontWeight: 800 }}>{p.name}</div>
                  <div class="hint">entry: {domain.entries.filter(e => e.personId === p.id).length}</div>
                </div>
                <div class="row">
                  <button class="btn" onClick={() => setEntryPersonId(p.id)}>선택</button>
                  <button class="btn danger" onClick={() => removePerson(p.id)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="card">
          <div class="h2">기록 추가</div>
          <div class="hint">기분/상호성/경계침해가 핵심. 여기서 “손해 이유”가 갈린다.</div>

          <div class="grid" style={{ marginTop: 12 }}>
            <div class="row">
              <select value={entryPersonId} onChange={(e) => setEntryPersonId((e.currentTarget as HTMLSelectElement).value)}>
                <option value="">사람 선택</option>
                {domain.people.map(p => <option value={p.id}>{p.name}</option>)}
              </select>
              <input class="input" type="date" value={entryDate} onInput={(e) => setEntryDate((e.currentTarget as HTMLInputElement).value)} />
            </div>

            <div class="row">
              <input class="input small" type="number" min={0} value={entryMinutes} onInput={(e) => setEntryMinutes(Number((e.currentTarget as HTMLInputElement).value))} />
              <div class="hint">분(시간 비용으로 환산)</div>
              <input class="input small" type="number" min={0} value={entryMoney} onInput={(e) => setEntryMoney(Number((e.currentTarget as HTMLInputElement).value))} />
              <div class="hint">원(직접 지출)</div>
            </div>

            <div class="row">
              <label class="pill">
                기분 변화
                <select value={moodDelta} onChange={(e) => setMoodDelta(Number((e.currentTarget as HTMLSelectElement).value) as any)}>
                  <option value={-2}>-2 박살</option>
                  <option value={-1}>-1 불쾌</option>
                  <option value={0}>0 무난</option>
                  <option value={1}>+1 좋음</option>
                  <option value={2}>+2 회복</option>
                </select>
              </label>
              <label class="pill">
                상호성
                <select value={reciprocity} onChange={(e) => setReciprocity(Number((e.currentTarget as HTMLSelectElement).value) as any)}>
                  <option value={1}>1 거의 없음</option>
                  <option value={2}>2 부족</option>
                  <option value={3}>3 보통</option>
                  <option value={4}>4 있음</option>
                  <option value={5}>5 매우 좋음</option>
                </select>
              </label>
            </div>

            <div class="row">
              <label class="row" style={{ gap: 8 }}>
                <input type="checkbox" checked={boundaryHit} onChange={(e) => setBoundaryHit((e.currentTarget as HTMLInputElement).checked)} />
                <span style={{ fontWeight: 800 }}>경계 침해 있었음</span>
              </label>
            </div>

            <textarea class="textarea" placeholder="메모 (공유 전 PII 스캔됨)" value={note} onInput={(e) => { setNote((e.currentTarget as HTMLTextAreaElement).value); setEntryError(''); }} />

            {entryError && <div class="hint danger" style={{ marginBottom: 8 }}>{entryError}</div>}
            <button class="btn primary" onClick={addEntry} disabled={!entryPersonId}>기록 저장</button>
          </div>
        </div>
      </div>

      <div class="grid cols-2" style={{ marginTop: 14 }}>
        <div class="card">
          <div class="h2">요약</div>
          <div class="hint">핵심만. 숫자 보고 감정 끊고 판단해.</div>

          <div class="stats" style={{ marginTop: 10 }}>
            <div class="stat">
              <div class="hint">총 손실</div>
              <div class="big danger">₩{report.totals.netLossWon.toLocaleString()}</div>
            </div>
            <div class="stat">
              <div class="hint">총 비용</div>
              <div class="big">₩{report.totals.costWon.toLocaleString()}</div>
            </div>
            <div class="stat">
              <div class="hint">ROI</div>
              <div class={`big ${report.totals.roiPct < 0 ? 'danger' : ''}`}>{report.totals.roiPct}%</div>
            </div>
          </div>

          <div class="callout" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900 }}>원인 1위: <span style={{ color: 'var(--accent)' }}>{report.topCauseLabel}</span></div>
            <div class="hint">손해 제일 큰 사람: {report.topPersonLabel}</div>
          </div>

          <div class="h2" style={{ marginTop: 16 }}>사람별 (손해순)</div>
          <div class="table" style={{ marginTop: 10 }}>
            <div class="thead">
              <div>상대</div><div>손실</div><div>원인</div><div>ROI</div>
            </div>
            {report.people.length === 0 && <div class="hint" style={{ padding: 10 }}>비어있음. 기록 2개만 쌓이면 여기부터 재미있다.</div>}
            {report.people.map(p => (
              <div class="trow">
                <div style={{ fontWeight: 800 }}>{p.personName}</div>
                <div class="danger">-₩{p.netLossWon.toLocaleString()}</div>
                <div class="pillMini">{causeLabel(p.topCause)}</div>
                <div>{p.roiPct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div class="card">
          <div class="h2">최근 기록</div>
          <div class="hint">삭제 가능. (사람 삭제하면 해당 기록도 같이 삭제)</div>

          <div class="list" style={{ marginTop: 10, maxHeight: 520, overflow: 'auto' }}>
            {domain.entries.length === 0 && <div class="hint">비어있음. 위에서 ‘오늘 10초 기록’ 한 번만 찍어.</div>}
            {domain.entries.slice(0, 30).map(e => {
              const person = domain.people.find(p => p.id === e.personId)
              return (
                <div class="listItem" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>{person?.name || '(unknown)'} <span class="hint">· {e.date}</span></div>
                    <div class="hint">{e.minutes}분 · ₩{e.moneyWon.toLocaleString()} · 기분 {e.moodDelta} · 상호성 {e.reciprocity} · {e.boundaryHit ? '경계침해' : '—'}</div>
                    {e.note && <div class="note">{e.note}</div>}
                  </div>
                  <button class="btn danger" onClick={() => removeEntry(e.id)}>삭제</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

<QuickLogFab
  onClick={() => setQuickOpen(true)}
  disabled={domain.people.length === 0}
/>
<QuickLogSheet
  open={quickOpen}
  onClose={() => setQuickOpen(false)}
  domain={domain}
  dispatch={dispatch}
  personId={entryPersonId}
  setPersonId={setEntryPersonId}
/>
    </div>
  )
}
