/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { uid } from '../../shared/storage/state'
import { buildReport, causeLabel, type CauseKey } from '../../shared/domain/report'
import { QuickLogBar } from './QuickLogBar'
import { QuickLogSheet } from './QuickLogSheet'
import { QuickLogFab } from './QuickLogFab'
import { WeeklySummaryCard } from './WeeklySummaryCard'
import { ReceiptCard } from './ReceiptCard'
import { EditEntryModal } from './EditEntryModal'
import { BackupRestoreCard } from './BackupRestoreCard'
import { InsightBanner } from './InsightBanner'
import { PersonDetailPage } from '../person/PersonDetailPage'
import type { Entry, Person } from '../../shared/storage/state'
import {
  validatePersonName,
  validateEntry,
  validateMonth,
} from '../../shared/utils/validation'

type ViewFilter = 'all' | 'personal' | 'client'

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
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [isClientNew, setIsClientNew] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [detailPerson, setDetailPerson] = useState<Person | null>(null)
  const [filterPersonId, setFilterPersonId] = useState('')
  const [filterCause, setFilterCause] = useState<CauseKey | ''>('')

  // Filter people by view filter
  const filteredPeople = useMemo(() => {
    if (viewFilter === 'all') return domain.people
    if (viewFilter === 'client') return domain.people.filter(p => p.isClient)
    return domain.people.filter(p => !p.isClient)
  }, [domain.people, viewFilter])

  // Count for tabs
  const clientCount = useMemo(() => domain.people.filter(p => p.isClient).length, [domain.people])
  const personalCount = useMemo(() => domain.people.filter(p => !p.isClient).length, [domain.people])

  // Total hours spent
  const totalHours = useMemo(() => {
    const mins = domain.entries.reduce((sum, e) => sum + e.minutes, 0)
    return (mins / 60).toFixed(1)
  }, [domain.entries])

  // Total direct money
  const totalDirectMoney = useMemo(() => {
    return domain.entries.reduce((sum, e) => sum + e.moneyWon, 0)
  }, [domain.entries])

  const report = useMemo(() => {
    const monthValidation = validateMonth(month)
    const opts: { month?: string; personId?: string; cause?: CauseKey } = {}
    if (monthValidation.valid && month) opts.month = month
    if (filterPersonId) opts.personId = filterPersonId
    if (filterCause) opts.cause = filterCause
    return buildReport(domain, opts)
  }, [domain, month, filterPersonId, filterCause])

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
    const p = { id: uid('p'), name, createdAt: new Date().toISOString(), isClient: isClientNew }
    dispatch({ type: 'PERSON_ADD', person: p })
    setNewPersonName('')
    setIsClientNew(false)
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
      {/* Hero Section - Total Loss */}
      <div class="card" style={{ background: 'var(--colorNeutralBackground4)', border: '2px solid var(--colorStatusDangerForeground1)', marginBottom: 16 }}>
        <div class="hint" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>현재까지 총 손실</div>
        <div style={{ fontSize: 'var(--fontSizeHero900)', fontWeight: 700, color: 'var(--colorStatusDangerForeground1)', lineHeight: 1.1, marginTop: 4 }}>
          -₩{report.totals.netLossWon.toLocaleString()}
        </div>
        <div class="hint" style={{ marginTop: 8 }}>
          시간 {totalHours}h · 직접 비용 ₩{totalDirectMoney.toLocaleString()} · ROI {report.totals.roiPct}%
        </div>
        {report.topCauseLabel && (
          <div style={{ marginTop: 8 }}>
            <span class="pillMini danger">손해 1위</span>
            <span style={{ marginLeft: 8, fontWeight: 700 }}>{report.topPersonLabel}</span>
            <span class="muted" style={{ marginLeft: 8 }}>원인: {report.topCauseLabel}</span>
          </div>
        )}
      </div>

      {/* 인사이트 배너 */}
      <InsightBanner domain={domain} />

      {/* Header with B2B Tabs */}
      <div class="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div class="h1">관계 감사 리포트</div>
          <div class="hint">사람/상황을 기록하면, 손익과 원인이 자동으로 뽑힌다.</div>
        </div>
        <div>
          <div class="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input class="input small" placeholder="YYYY-MM" value={month} onInput={(e) => handleMonthChange((e.currentTarget as HTMLInputElement).value)} style={{ width: 100 }} />
            <select class="input small" value={filterPersonId} onChange={(e) => setFilterPersonId((e.currentTarget as HTMLSelectElement).value)} style={{ width: 100 }}>
              <option value="">모든 사람</option>
              {domain.people.map(p => <option value={p.id}>{p.name}</option>)}
            </select>
            <select class="input small" value={filterCause} onChange={(e) => setFilterCause((e.currentTarget as HTMLSelectElement).value as CauseKey | '')} style={{ width: 110 }}>
              <option value="">모든 원인</option>
              <option value="BOUNDARY">추가 비용</option>
              <option value="TIME">인건비</option>
              <option value="MONEY">직접 지출</option>
              <option value="MOOD">감정세</option>
              <option value="RECIPROCITY">투자 효율</option>
            </select>
            <button class="btn" onClick={() => { setMonth(''); setMonthError(''); setFilterPersonId(''); setFilterCause(''); }}>초기화</button>
          </div>
          {monthError && <div class="hint danger" style={{ marginTop: 4 }}>{monthError}</div>}
        </div>
      </div>

      {/* B2B Filter Tabs */}
      <div class="tabs" style={{ marginTop: 12 }}>
        <button class={`tab ${viewFilter === 'all' ? 'active' : ''}`} onClick={() => setViewFilter('all')}>
          전체 ({domain.people.length})
        </button>
        <button class={`tab ${viewFilter === 'personal' ? 'active' : ''}`} onClick={() => setViewFilter('personal')}>
          관계 ({personalCount})
        </button>
        <button class={`tab ${viewFilter === 'client' ? 'active' : ''}`} onClick={() => setViewFilter('client')}>
          클라이언트 ({clientCount})
        </button>
      </div>

      <QuickLogBar
        domain={domain}
        dispatch={dispatch}
        personId={entryPersonId}
        setPersonId={setEntryPersonId}
      />

      {/* 주간 요약 + 영수증 카드 */}
      <div class="grid cols-2" style={{ marginTop: 14 }}>
        <WeeklySummaryCard domain={domain} />
        <ReceiptCard domain={domain} />
      </div>

      <div class="grid cols-2" style={{ marginTop: 14 }}>
        <div class="card">
          <div class="h2">대상 추가</div>
          <div class="row" style={{ marginTop: 10 }}>
            <input class="input" placeholder="이름/호칭 (공유 시 익명화 가능)" value={newPersonName} onInput={(e) => { setNewPersonName((e.currentTarget as HTMLInputElement).value); setPersonNameError(''); }} />
            <button class="btn primary" onClick={addPerson}>추가</button>
          </div>
          <div class="row" style={{ marginTop: 8 }}>
            <label class="row" style={{ gap: 8 }}>
              <input type="checkbox" checked={isClientNew} onChange={(e) => setIsClientNew((e.currentTarget as HTMLInputElement).checked)} />
              <span style={{ fontWeight: 600 }}>클라이언트 (업무)</span>
            </label>
          </div>
          {personNameError && <div class="hint danger" style={{ marginTop: 6 }}>{personNameError}</div>}
          <div class="hint" style={{ marginTop: 10 }}>
            팁: 클라이언트 체크하면 B2B 탭에서 따로 관리 가능.
          </div>

          <div class="h2" style={{ marginTop: 18 }}>
            {viewFilter === 'client' ? '클라이언트 목록' : viewFilter === 'personal' ? '관계 목록' : '전체 목록'}
          </div>
          <div class="list" style={{ marginTop: 10 }}>
            {filteredPeople.length === 0 && <div class="hint">비어있음. 사람 1명 추가하고 '오늘 10초 기록'부터.</div>}
            {filteredPeople.map(p => (
              <div class="listItem" style={{ cursor: 'pointer' }} onClick={() => setDetailPerson(p)}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {p.name}
                    {p.isClient && <span class="pillMini" style={{ marginLeft: 6 }}>업무</span>}
                  </div>
                  <div class="hint">기록: {domain.entries.filter(e => e.personId === p.id).length}개</div>
                </div>
                <div class="row" onClick={(e) => e.stopPropagation()}>
                  <button class="btn" onClick={() => setEntryPersonId(p.id)}>선택</button>
                  <button class="btn subtle" onClick={() => setDetailPerson(p)}>상세</button>
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
              <input
                class="input small"
                type="number"
                min={0}
                max={1440}
                value={entryMinutes}
                onInput={(e) => {
                  const val = Number((e.currentTarget as HTMLInputElement).value)
                  setEntryMinutes(Math.max(0, Math.min(1440, val || 0)))
                }}
              />
              <div class="hint">분(시간 비용으로 환산)</div>
              <input
                class="input small"
                type="number"
                min={0}
                max={100000000}
                value={entryMoney}
                onInput={(e) => {
                  const val = Number((e.currentTarget as HTMLInputElement).value)
                  setEntryMoney(Math.max(0, Math.min(100000000, val || 0)))
                }}
              />
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
                  <div class="row">
                    <button class="btn" onClick={() => setEditingEntry(e)}>수정</button>
                    <button class="btn danger" onClick={() => removeEntry(e.id)}>삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 백업/복원 */}
      <BackupRestoreCard domain={domain} dispatch={dispatch} />

      {/* 기록 수정 모달 */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          domain={domain}
          dispatch={dispatch}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* 사람 상세 페이지 */}
      {detailPerson && (
        <PersonDetailPage
          domain={domain}
          person={detailPerson}
          dispatch={dispatch}
          onClose={() => setDetailPerson(null)}
        />
      )}

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
