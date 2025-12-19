/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { AppState as DomainState, Entry, Person } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { uid } from '../../shared/storage/state'
import { buildReport } from '../../shared/domain/report'

const ONBOARDING_VERSION = 1

function todayYmd() {
  // local yyyy-mm-dd
  try {
    return new Date().toLocaleDateString('sv-SE')
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export function needsOnboarding(domain: DomainState) {
  return !domain.settings.onboardingCompleted || domain.settings.onboardingVersion !== ONBOARDING_VERSION
}

export function completeOnboarding(dispatch: (e: AppEvent) => void) {
  dispatch({ type: 'SETTINGS_PATCH', patch: { onboardingCompleted: true, onboardingVersion: ONBOARDING_VERSION } })
}

export function OnboardingOverlay({ domain, dispatch }: { domain: DomainState; dispatch: (e: AppEvent) => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const people = domain.people
  const entries = domain.entries

  const report = useMemo(() => {
    try { return buildReport(domain) } catch { return null }
  }, [domain])

  const canGoStep1 = step === 0
  const canGoStep2 = step >= 1 && people.length >= 2
  const canGoStep3 = step >= 2 && (entries.length >= 2 || entries.some(e => e.note?.includes('[demo]')))
  const canFinish = step >= 3

  const addPerson = (raw: string) => {
    const n = raw.trim()
    if (!n) return
    const p: Person = { id: uid('p'), name: n, createdAt: new Date().toISOString() }
    dispatch({ type: 'PERSON_ADD', person: p })
  }

  const ensureTwoPeople = (): Person[] => {
    const desired = ['A', 'B']
    const list: Person[] = [...domain.people]
    const names = new Set(list.map(p => p.name))
    for (const n of desired) {
      if (list.length >= 2) break
      if (names.has(n)) continue
      const p: Person = { id: uid('p'), name: n, createdAt: new Date().toISOString() }
      dispatch({ type: 'PERSON_ADD', person: p })
      list.push(p)
      names.add(n)
    }
    return list.slice(0, 2)
  }

  const quickPeople = () => {
    ensureTwoPeople()
  }

  const seedDemo = () => {
    // guard: don't duplicate demo
    if (domain.entries.some(e => (e.note || '').includes('[demo]'))) return

    const [p0, p1] = ensureTwoPeople()
    if (!p0) return

    const date = todayYmd()
    const demoEntries: Entry[] = [
      {
        id: uid('e'),
        personId: p0.id,
        date,
        minutes: 90,
        moneyWon: 35000,
        moodDelta: -1,
        reciprocity: 2,
        boundaryHit: true,
        note: '[demo] 급한 부탁 + 경계 침범. 응해주고 후회.',
      },
      {
        id: uid('e'),
        personId: (p1?.id || p0.id),
        date,
        minutes: 45,
        moneyWon: 0,
        moodDelta: 1,
        reciprocity: 4,
        boundaryHit: false,
        note: '[demo] 상호 이득. 기분도 좋아짐.',
      }
    ]
    for (const e of demoEntries) dispatch({ type: 'ENTRY_ADD', entry: e })
  }

  const header = (title: string, sub: string) => (
    <div>
      <div class="h1" style={{ margin: 0 }}>{title}</div>
      <div class="hint" style={{ marginTop: 6 }}>{sub}</div>
    </div>
  )

  const StepDots = () => (
    <div class="obDots">
      {[0,1,2,3].map(i => (
        <div class={`obDot ${i<=step ? 'on' : ''}`}></div>
      ))}
    </div>
  )

  const skip = () => {
    completeOnboarding(dispatch)
  }

  const next = () => {
    if (step === 0) setStep(1)
    else if (step === 1 && people.length >= 2) setStep(2)
    else if (step === 2 && (entries.length >= 2 || entries.some(e => (e.note||'').includes('[demo]')))) setStep(3)
    else if (step >= 3) completeOnboarding(dispatch)
  }

  return (
    <div class="modalOverlay">
      <div class="modal obModal">
        <div class="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div class="badge">1분 온보딩</div>
            <StepDots />
          </div>
          <button class="btn" onClick={skip}>건너뛰기</button>
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <div style={{ marginTop: 14 }}>
            {header('감정 빼고, 손익만 정리한다.', '딱 1분만. 사람 2명 + 기록 2개 만들면 “공유 카드”까지 바로 나온다.')}
            <div class="card" style={{ marginTop: 14 }}>
              <div class="h2">규칙</div>
              <ul class="obList">
                <li>이 앱은 너 대신 착한 척 안 한다. <span class="muted">손해면 손해라고 말한다.</span></li>
                <li>데이터는 브라우저 로컬에만 저장. <span class="muted">기본은 서버 전송 없음.</span></li>
                <li>공유할 땐 A/B/C 익명화 + 체크리스트로 사고 방지.</li>
              </ul>
            </div>

            <div class="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
              <button class="btn primary" onClick={next}>시작</button>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ marginTop: 14 }}>
            {header('Step 1. 사람 2명만 등록해.', '실명 넣지 마. 닉네임/이니셜이면 충분하다.')}
            <div class="grid cols-2" style={{ marginTop: 14 }}>
              <div class="card">
                <div class="h2">현재 등록</div>
                <div class="obPeople">
                  {people.length === 0 && <div class="hint">아직 없음</div>}
                  {people.map(p => <span class="obChip">{p.name}</span>)}
                </div>

                <div class="row" style={{ marginTop: 12, gap: 8 }}>
                  <input
                    class="input"
                    value={name}
                    placeholder="예: A, B, 팀장, 엄마, 전여친…"
                    onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
                  />
                  <button class="btn" onClick={() => { addPerson(name); setName('') }}>추가</button>
                </div>

                <div class="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
                  <button class="btn" onClick={quickPeople}>빠른 시작 (A/B 자동)</button>
                  <div class="pill">{people.length}/2</div>
                </div>
              </div>

              <div class="card">
                <div class="h2">왜 2명이냐?</div>
                <div class="hint">비교가 생기면 뇌가 “패턴”을 인식한다. 그때부터 재미있어진다.</div>
                <div style={{ marginTop: 10 }}>
                  <div class="pill warn">팁</div>
                  <div class="hint" style={{ marginTop: 6 }}>
                    2명 중 1명은 “애매한 사람”으로 잡아라. 애매한 게 제일 돈/시간을 뺏는다.
                  </div>
                </div>
              </div>
            </div>

            <div class="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
              <button class="btn" onClick={() => setStep(0)}>이전</button>
              <button class={`btn primary ${people.length>=2 ? '' : 'disabled'}`} disabled={people.length < 2} onClick={next}>
                다음
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ marginTop: 14 }}>
            {header('Step 2. 기록 2개만 찍고 끝.', '직접 쓰기 귀찮으면 샘플을 넣어준다. 핵심은 “숫자로 체감”하는 것.')}
            <div class="grid cols-2" style={{ marginTop: 14 }}>
              <div class="card">
                <div class="h2">샘플 기록 자동 생성</div>
                <div class="hint">“경계 침해 + 후회” 1개, “상호 이득” 1개를 넣어 비교를 만든다.</div>
                <div class="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                  <button class={`btn ${entries.some(e => (e.note||'').includes('[demo]')) ? 'disabled' : ''}`} disabled={entries.some(e => (e.note||'').includes('[demo]'))} onClick={seedDemo}>
                    샘플 추가
                  </button>
                  <div class="pill">{entries.length}개 기록</div>
                </div>
                <div class="hint" style={{ marginTop: 10 }}>
                  샘플은 note에 <span class="mono">[demo]</span>가 붙는다. 싫으면 나중에 삭제하면 끝.
                </div>
              </div>

              <div class="card">
                <div class="h2">직접 기록할래?</div>
                <div class="hint">대시보드에서 1분이면 된다. 딱 이것만:</div>
                <ul class="obList">
                  <li>몇 분 뺏겼나</li>
                  <li>돈 나갔나</li>
                  <li>기분이 내려갔나</li>
                  <li>상대가 보답했나</li>
                  <li>경계 침범했나</li>
                </ul>
                <div class="row" style={{ marginTop: 10 }}>
                  <button class="btn" onClick={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })}>대시보드로 가기</button>
                </div>
              </div>
            </div>

            <div class="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
              <button class="btn" onClick={() => setStep(1)}>이전</button>
              <button class={`btn primary ${(entries.length>=2 || entries.some(e => (e.note||'').includes('[demo]'))) ? '' : 'disabled'}`}
                disabled={!(entries.length>=2 || entries.some(e => (e.note||'').includes('[demo]')))} onClick={next}>
                다음
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ marginTop: 14 }}>
            {header('Step 3. 이게 바이럴 포인트다.', '공유 카드로 “정리된 복수”를 한다. 말로 싸우지 말고 숫자로 조져.')}
            <div class="grid cols-2" style={{ marginTop: 14 }}>
              <div class="card">
                <div class="h2">미리보기</div>
                {!report && <div class="hint">리포트를 만들 수 없음</div>}
                {report && (
                  <div class="obPreview">
                    <div class="obPreviewTop">
                      <div style={{ fontWeight: 900 }}>Relationship ROI</div>
                      <div class="pill">{domain.plan === 'paid' ? 'PRO' : 'FREE'}</div>
                    </div>
                    <div class="obBig">{report.totals.netLossWon.toLocaleString()}원</div>
                    <div class="hint">이번 창(기본): 순손해</div>
                    <div class="obKpis">
                      <div class="obKpi">
                        <div class="hint">최악의 사람</div>
                        <div style={{ fontWeight: 800 }}>{report.topPersonLabel}</div>
                      </div>
                      <div class="obKpi">
                        <div class="hint">주 원인</div>
                        <div style={{ fontWeight: 800 }}>{report.topCauseLabel}</div>
                      </div>
                    </div>
                    <div class="hint" style={{ marginTop: 10 }}>공유 탭에서 레이아웃/카피를 더 잔인하게 바꿀 수 있다.</div>
                  </div>
                )}
              </div>

              <div class="card">
                <div class="h2">다음 액션</div>
                <div class="hint">스토리 올리는 건 선택. 그래도 “정리”는 남는다.</div>
                <ul class="obList">
                  <li>공유 탭에서 익명화/체크리스트로 사고 방지</li>
                  <li>코치 탭에서 “단호한 거절” 문구 뽑기</li>
                  <li>기록은 10초만 해도 쌓이면 칼이 된다</li>
                </ul>
                <div class="row" style={{ marginTop: 12, gap: 8 }}>
                  <button class="btn" onClick={() => dispatch({ type: 'SET_TAB', tab: 'share' })}>공유 탭 열기</button>
                  <button class="btn" onClick={() => dispatch({ type: 'SET_TAB', tab: 'coach' })}>코치 열기</button>
                </div>
              </div>
            </div>

            <div class="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
              <button class="btn" onClick={() => setStep(2)}>이전</button>
              <button class="btn primary" onClick={() => { completeOnboarding(dispatch); dispatch({ type: 'SET_TAB', tab: 'dashboard' }) }}>
                끝내기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
