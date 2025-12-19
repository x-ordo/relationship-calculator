/** @jsxImportSource preact */
import { useMemo } from 'preact/hooks'
import type { AppState } from '../../state/state'
import type { AppEvent } from '../../state/events'
import { buildReport } from '../../shared/domain/report'
import type { CoachTone } from '../../shared/rules/fakeCoach'

type Actions = {
  runCoach: () => any
}

const TONES: CoachTone[] = ['냉정', '정중', '유머']

export function CoachPage({ state, dispatch, actions }: { state: AppState; dispatch: (e: AppEvent) => void; actions: Actions }) {
  const report = useMemo(() => buildReport(state.domain), [state.domain])

  const paid = state.domain.plan === 'paid'
  const token = state.domain.entitlement?.token || ''
  const paidReady = paid && !!token

  const { draft, run, needPro } = state.coachUi

  const runLabel =
    run.status === 'loading'
      ? '분석 중...'
      : paid
        ? 'PRO 코치 돌리기'
        : '무료 코치 돌리기'

  return (
    <div class="page">
      <div class="h1">코치</div>

      <div class="callout">
        <div style={{ fontWeight: 900 }}>모드: {paid ? 'PRO(서버)' : '무료(로컬 규칙)'}</div>
        <div class="hint">
          {paid
            ? (paidReady ? '서버 LLM 코치 호출 (PII 마스킹 후 전송)' : 'PRO 상태지만 토큰이 비어있음 → 언락 필요')
            : '진짜 AI 호출 없음. “AI인 척” 하는 규칙 기반 코치.'}
        </div>
        <div class="hint" style={{ marginTop: 6 }}>
          이번 달 ROI: <b>{report.totals.roiPct}%</b> · 순손실: <b>₩{report.totals.netLossWon.toLocaleString()}</b> · 원인 1위: <b>{report.topCauseLabel}</b>
        </div>
      </div>

      {needPro && (
        <div class="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>PRO 토큰 필요</div>
          <div class="hint">PRO 탭에서 “언락 코드 → 토큰 발급”을 먼저 하세요.</div>
          <div class="row" style={{ marginTop: 10 }}>
            <button class="btn" onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>PRO로 이동</button>
            <button class="btn ghost" onClick={() => dispatch({ type: 'TOKEN_UNSET' })}>무료 모드로 되돌리기</button>
          </div>
        </div>
      )}

      <div class="h2" style={{ marginTop: 16 }}>톤</div>
      <div class="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {TONES.map(t => (
          <button
            class={`btn ${draft.tone === t ? '' : 'ghost'}`}
            onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { tone: t } })}
          >
            {t}
          </button>
        ))}
      </div>

      <div class="h2" style={{ marginTop: 16 }}>상황(한 줄로)</div>
      <textarea
        class="textarea"
        placeholder="예: 매번 일방적으로 부탁만 하는데, 거절하면 기분 상할까봐 못 끊겠음"
        value={draft.situation}
        onInput={(e) => dispatch({ type: 'COACH_DRAFT', patch: { situation: (e.currentTarget as HTMLTextAreaElement).value } })}
        rows={4}
      />

      <div class="row" style={{ marginTop: 12 }}>
        <button class="btn" disabled={run.status === 'loading' || !draft.situation.trim()} onClick={() => actions.runCoach()}>
          {runLabel}
        </button>
        <button class="btn ghost" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { situation: '' } })}>
          비우기
        </button>
        {paid && (
          <button class="btn ghost" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>
            PRO 관리
          </button>
        )}
      </div>

      {run.status === 'error' && (
        <div class="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>실패</div>
          <div class="hint">{run.error}</div>
        </div>
      )}

      {run.status === 'success' && (
        <div style={{ marginTop: 16 }}>
          <div class="h2">{run.data.title}</div>
          <div class="callout" style={{ marginTop: 10 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{run.data.diagnosis}</div>
          </div>

          <div class="h2" style={{ marginTop: 16 }}>스크립트</div>
          <div class="grid" style={{ marginTop: 10 }}>
            {run.data.scripts.map(s => (
              <div class="card">
                <div class="cardTitle">{s.title}</div>
                <div class="cardBody" style={{ whiteSpace: 'pre-wrap' }}>{s.text}</div>
              </div>
            ))}
          </div>

          <div class="h2" style={{ marginTop: 16 }}>다음 액션</div>
          <ul class="list" style={{ marginTop: 8 }}>
            {run.data.next.map(n => <li>{n}</li>)}
          </ul>

          {run.data.disclaimer && (
            <div class="hint" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{run.data.disclaimer}</div>
          )}
        </div>
      )}
    </div>
  )
}
