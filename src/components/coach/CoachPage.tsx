/** @jsxImportSource preact */
import { useMemo } from 'preact/hooks'
import type { AppState } from '../../state/state'
import type { AppEvent } from '../../state/events'
import { buildReport } from '../../shared/domain/report'
import type { CoachTone, CoachContext, CoachResult } from '../../shared/rules/fakeCoach'

type Actions = {
  runCoach: () => any
}

const TONES: CoachTone[] = ['냉정', '정중', '유머']
const CONTEXTS: { value: CoachContext; label: string }[] = [
  { value: 'personal', label: '개인 관계 (B2C)' },
  { value: 'client', label: '클라이언트 (B2B)' },
]

const GRADE_COLORS: Record<CoachResult['grade'], string> = {
  GUILTY: 'var(--colorStatusDangerForeground1)',
  WARNING: 'var(--colorStatusWarningForeground1)',
  PROBATION: 'var(--colorBrandForeground1)',
  INNOCENT: 'var(--colorStatusSuccessForeground1)',
}

const GRADE_LABELS: Record<CoachResult['grade'], string> = {
  GUILTY: '유죄 (즉시 손절)',
  WARNING: '경고 (비중 축소)',
  PROBATION: '집행유예 (관찰)',
  INNOCENT: '무죄 (유지)',
}

export function CoachPage({ state, dispatch, actions }: { state: AppState; dispatch: (e: AppEvent) => void; actions: Actions }) {
  const report = useMemo(() => buildReport(state.domain), [state.domain])

  const paid = state.domain.plan === 'paid'
  const token = state.domain.entitlement?.token || ''
  const paidReady = paid && !!token

  const { draft, run, needPro } = state.coachUi

  const runLabel =
    run.status === 'loading'
      ? '심리 중...'
      : paid
        ? 'PRO 판결 요청'
        : '무료 판결 요청'

  return (
    <div class="panel">
      <div class="h1">AI 판사</div>
      <div class="hint">법원 판결문 스타일로 관계를 심판합니다.</div>

      <div class="callout" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 900 }}>모드: {paid ? 'PRO(서버 AI)' : '무료(규칙 기반)'}</div>
        <div class="hint">
          {paid
            ? (paidReady ? '서버 LLM 호출 (PII 마스킹 적용)' : 'PRO 상태지만 토큰이 비어있음 → 언락 필요')
            : '로컬 규칙 기반 판결. PRO 전환 시 진짜 AI 판사.'}
        </div>
        <div class="hint" style={{ marginTop: 6 }}>
          이번 달 ROI: <b>{report.totals.roiPct}%</b> · 순손실: <b style={{ color: 'var(--colorStatusDangerForeground1)' }}>-₩{report.totals.netLossWon.toLocaleString()}</b> · 원인 1위: <b>{report.topCauseLabel}</b>
        </div>
      </div>

      {needPro && (
        <div class="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>PRO 토큰 필요</div>
          <div class="hint">PRO 탭에서 "언락 코드 → 토큰 발급"을 먼저 하세요.</div>
          <div class="row" style={{ marginTop: 10 }}>
            <button class="btn" onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>PRO로 이동</button>
            <button class="btn subtle" onClick={() => dispatch({ type: 'TOKEN_UNSET' })}>무료 모드로 되돌리기</button>
          </div>
        </div>
      )}

      {/* 컨텍스트 선택 (B2B/B2C) */}
      <div class="h2" style={{ marginTop: 16 }}>심판 대상</div>
      <div class="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {CONTEXTS.map(c => (
          <button
            class={`btn ${draft.context === c.value ? '' : 'subtle'}`}
            onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { context: c.value } })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div class="h2" style={{ marginTop: 16 }}>판결 톤</div>
      <div class="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {TONES.map(t => (
          <button
            class={`btn ${draft.tone === t ? '' : 'subtle'}`}
            onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { tone: t } })}
          >
            {t}
          </button>
        ))}
      </div>

      <div class="h2" style={{ marginTop: 16 }}>상황 진술</div>
      <textarea
        class="textarea"
        placeholder="예: 매번 일방적으로 부탁만 하는데, 거절하면 기분 상할까봐 못 끊겠음"
        value={draft.situation}
        onInput={(e) => dispatch({ type: 'COACH_DRAFT', patch: { situation: (e.currentTarget as HTMLTextAreaElement).value } })}
        rows={4}
      />

      <div class="row" style={{ marginTop: 12 }}>
        <button class="btn primary" disabled={run.status === 'loading' || !draft.situation.trim()} onClick={() => actions.runCoach()}>
          {runLabel}
        </button>
        <button class="btn subtle" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { situation: '' } })}>
          비우기
        </button>
        {paid && (
          <button class="btn subtle" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>
            PRO 관리
          </button>
        )}
      </div>

      {run.status === 'error' && (
        <div class="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>심리 실패</div>
          <div class="hint">{run.error}</div>
        </div>
      )}

      {run.status === 'success' && (
        <div class="verdict-result" style={{ marginTop: 16 }}>
          {/* 판결문 헤더 */}
          <div class="card" style={{ background: 'var(--colorNeutralBackground4)', border: '2px solid var(--colorNeutralStroke1)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fontSizeBase200)', color: 'var(--colorNeutralForeground3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                관계 감사 법원
              </div>
              <div style={{ fontSize: 'var(--fontSizeBase500)', fontWeight: 700, marginTop: 8 }}>
                {run.data.title}
              </div>
            </div>

            {/* 판결 등급 */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: 'var(--borderRadiusCircular)',
                border: `2px solid ${GRADE_COLORS[run.data.grade]}`,
                color: GRADE_COLORS[run.data.grade],
                fontWeight: 700,
                fontSize: 'var(--fontSizeBase400)',
              }}>
                {GRADE_LABELS[run.data.grade]}
              </span>
            </div>

            {/* 판결 요약 */}
            <div class="callout" style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>주문</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{run.data.verdict}</div>
            </div>

            {/* 판결 이유 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>판결 이유</div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--colorNeutralForeground2)', lineHeight: 1.6 }}>{run.data.reasoning}</div>
            </div>
          </div>

          {/* 선고 문구 (복붙용) */}
          <div class="h2" style={{ marginTop: 20 }}>선고 문구 (복사해서 사용)</div>
          <div class="grid" style={{ marginTop: 10 }}>
            {run.data.sentences.map(s => (
              <div class="card" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(s.text)}>
                <div style={{ fontSize: 'var(--fontSizeBase200)', color: 'var(--colorNeutralForeground3)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{s.text}</div>
                <div class="hint" style={{ marginTop: 8, fontSize: 'var(--fontSizeBase100)' }}>클릭하면 복사</div>
              </div>
            ))}
          </div>

          {/* 이행 조항 */}
          <div class="h2" style={{ marginTop: 20 }}>이행 조항</div>
          <div class="list" style={{ marginTop: 10 }}>
            {run.data.actions.map((a, i) => (
              <div class="listItem" style={{ justifyContent: 'flex-start' }}>
                <span style={{ color: 'var(--colorNeutralForeground3)', marginRight: 8 }}>{i + 1}.</span>
                <span>{a}</span>
              </div>
            ))}
          </div>

          {/* 고지 */}
          {run.data.disclaimer && (
            <div class="hint" style={{ marginTop: 16, padding: 12, background: 'var(--colorNeutralBackground2)', borderRadius: 'var(--borderRadiusMedium)' }}>
              {run.data.disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
