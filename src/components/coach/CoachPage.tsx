import { useMemo } from 'react'
import { Button, Card, Textarea } from '@fluentui/react-components'
import type { AppState } from '../../state/state'
import type { AppEvent } from '../../state/events'
import { buildReport } from '../../shared/domain/report'
import type { CoachTone, CoachContext, CoachResult } from '../../shared/rules/fakeCoach'
import { VoiceInputButton } from '../common/VoiceInputButton'
import { LoadingSpinner } from '../common/LoadingSpinner'

type Actions = {
  runCoach: () => any
}

const TONES: CoachTone[] = ['냉정', '정중', '유머']
const CONTEXTS: { value: CoachContext; label: string }[] = [
  { value: 'personal', label: '개인 관계 (B2C)' },
  { value: 'client', label: '클라이언트 (B2B)' },
]

const MAX_SITUATION_LENGTH = 500

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

  const paid = state.domain.plan !== 'free'
  const token = state.domain.entitlement?.token || ''
  const paidReady = paid && !!token

  const { draft, run, needPro, rateLimit } = state.coachUi

  // Rate limit 계산
  const rateLimitInfo = useMemo(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const recentRequests = rateLimit.requests.filter(t => t > oneMinuteAgo)
    const remaining = Math.max(0, rateLimit.limitPerMinute - recentRequests.length)
    const isLimited = recentRequests.length >= rateLimit.limitPerMinute
    return { remaining, total: rateLimit.limitPerMinute, isLimited }
  }, [rateLimit.requests, rateLimit.limitPerMinute])

  // 입력 길이 체크
  const situationLength = draft.situation.length
  const isOverLimit = situationLength > MAX_SITUATION_LENGTH

  const runLabel =
    run.status === 'loading'
      ? '심리 중...'
      : paid
        ? 'PRO 판결 요청'
        : '무료 판결 요청'

  const canRun = !isOverLimit && draft.situation.trim().length > 0 && run.status !== 'loading'

  return (
    <div className="panel">
      <div className="h1">AI 판사</div>
      <div className="hint">법원 판결문 스타일로 관계를 심판합니다.</div>

      <div className="callout" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 900 }}>모드: {paid ? 'PRO(서버 AI)' : '무료(규칙 기반)'}</div>
        <div className="hint">
          {paid
            ? (paidReady ? '서버 LLM 호출 (PII 마스킹 적용)' : 'PRO 상태지만 토큰이 비어있음 → 언락 필요')
            : '로컬 규칙 기반 판결. PRO 전환 시 진짜 AI 판사.'}
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          이번 달 ROI: <b>{report.totals.roiPct}%</b> · 순손실: <b style={{ color: 'var(--colorStatusDangerForeground1)' }}>-₩{report.totals.netLossWon.toLocaleString()}</b> · 원인 1위: <b>{report.topCauseLabel}</b>
        </div>
      </div>

      {needPro && (
        <div className="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>PRO 토큰 필요</div>
          <div className="hint">PRO 탭에서 "언락 코드 → 토큰 발급"을 먼저 하세요.</div>
          <div className="row" style={{ marginTop: 10 }}>
            <Button onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>PRO로 이동</Button>
            <Button appearance="subtle" onClick={() => dispatch({ type: 'TOKEN_UNSET' })}>무료 모드로 되돌리기</Button>
          </div>
        </div>
      )}

      {/* 컨텍스트 선택 (B2B/B2C) */}
      <div className="h2" style={{ marginTop: 16 }}>심판 대상</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {CONTEXTS.map(c => (
          <Button
            key={c.value}
            appearance={draft.context === c.value ? 'primary' : 'subtle'}
            onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { context: c.value } })}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div className="h2" style={{ marginTop: 16 }}>판결 톤</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {TONES.map(t => (
          <Button
            key={t}
            appearance={draft.tone === t ? 'primary' : 'subtle'}
            onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { tone: t } })}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="h2" style={{ margin: 0 }}>상황 진술</div>
        <VoiceInputButton
          onTranscript={(text) => {
            const newSituation = (draft.situation + ' ' + text).trim()
            if (newSituation.length <= MAX_SITUATION_LENGTH + 50) {
              dispatch({ type: 'COACH_DRAFT', patch: { situation: newSituation } })
            }
          }}
          disabled={run.status === 'loading'}
        />
      </div>
      <Textarea
        placeholder="예: 매번 일방적으로 부탁만 하는데, 거절하면 기분 상할까봐 못 끊겠음"
        value={draft.situation}
        onChange={(_, data) => {
          if (data.value.length <= MAX_SITUATION_LENGTH + 50) {
            dispatch({ type: 'COACH_DRAFT', patch: { situation: data.value } })
          }
        }}
        rows={4}
        style={{ borderColor: isOverLimit ? 'var(--colorStatusDangerForeground1)' : undefined }}
      />
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <div className="hint">
          {isOverLimit && <span style={{ color: 'var(--colorStatusDangerForeground1)' }}>최대 {MAX_SITUATION_LENGTH}자까지 입력 가능</span>}
        </div>
        <div className="hint" style={{ color: isOverLimit ? 'var(--colorStatusDangerForeground1)' : undefined }}>
          {situationLength} / {MAX_SITUATION_LENGTH}
        </div>
      </div>

      {/* Rate limit 표시 (PRO만) */}
      {paid && (
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <div className="hint" style={{
            padding: '4px 8px',
            background: rateLimitInfo.isLimited ? 'var(--colorStatusDangerBackground1)' : 'var(--colorNeutralBackground2)',
            borderRadius: 'var(--borderRadiusMedium)',
            border: `1px solid ${rateLimitInfo.isLimited ? 'var(--colorStatusDangerForeground1)' : 'var(--colorNeutralStroke1)'}`,
          }}>
            남은 요청: <b style={{ color: rateLimitInfo.isLimited ? 'var(--colorStatusDangerForeground1)' : 'var(--colorBrandForeground1)' }}>
              {rateLimitInfo.remaining}/{rateLimitInfo.total}
            </b> (1분당)
          </div>
          {rateLimitInfo.isLimited && (
            <div className="hint" style={{ color: 'var(--colorStatusDangerForeground1)' }}>
              잠시 후 다시 시도해주세요
            </div>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <Button appearance="primary" disabled={!canRun || (paid && rateLimitInfo.isLimited)} onClick={() => actions.runCoach()}>
          {runLabel}
        </Button>
        <Button appearance="subtle" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'COACH_DRAFT', patch: { situation: '' } })}>
          비우기
        </Button>
        {paid && (
          <Button appearance="subtle" disabled={run.status === 'loading'} onClick={() => dispatch({ type: 'SET_TAB', tab: 'pro' })}>
            PRO 관리
          </Button>
        )}
      </div>

      {/* 로딩 상태 - 동적 메시지 스피너 */}
      {run.status === 'loading' && (
        <Card className="card" style={{ marginTop: 16 }}>
          <LoadingSpinner variant="coach" color="gold" />
        </Card>
      )}

      {run.status === 'error' && (
        <div className="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>심리 실패</div>
          <div className="hint">{run.error}</div>
        </div>
      )}

      {run.status === 'success' && (
        <div className="verdict-result" style={{ marginTop: 16 }}>
          {/* 판결문 헤더 */}
          <Card className="card" style={{ background: 'var(--colorNeutralBackground4)', border: '2px solid var(--colorNeutralStroke1)' }}>
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
            <div className="callout" style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>주문</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{run.data.verdict}</div>
            </div>

            {/* 판결 이유 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>판결 이유</div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--colorNeutralForeground2)', lineHeight: 1.6 }}>{run.data.reasoning}</div>
            </div>
          </Card>

          {/* 선고 문구 (복붙용) */}
          <div className="h2" style={{ marginTop: 20 }}>선고 문구 (복사해서 사용)</div>
          <div className="grid" style={{ marginTop: 10 }}>
            {run.data.sentences.map((s, i) => (
              <Card key={i} className="card" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(s.text)}>
                <div style={{ fontSize: 'var(--fontSizeBase200)', color: 'var(--colorNeutralForeground3)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{s.text}</div>
                <div className="hint" style={{ marginTop: 8, fontSize: 'var(--fontSizeBase100)' }}>클릭하면 복사</div>
              </Card>
            ))}
          </div>

          {/* 이행 조항 */}
          <div className="h2" style={{ marginTop: 20 }}>이행 조항</div>
          <div className="list" style={{ marginTop: 10 }}>
            {run.data.actions.map((a, i) => (
              <div key={i} className="listItem" style={{ justifyContent: 'flex-start' }}>
                <span style={{ color: 'var(--colorNeutralForeground3)', marginRight: 8 }}>{i + 1}.</span>
                <span>{a}</span>
              </div>
            ))}
          </div>

          {/* 고지 */}
          {run.data.disclaimer && (
            <div className="hint" style={{ marginTop: 16, padding: 12, background: 'var(--colorNeutralBackground2)', borderRadius: 'var(--borderRadiusMedium)' }}>
              {run.data.disclaimer}
            </div>
          )}

          {/* 소셜 공유 */}
          <div className="h2" style={{ marginTop: 20 }}>판결 공유</div>
          <div className="row" style={{ marginTop: 10, gap: 8 }}>
            <Button
              onClick={() => {
                const text = `[관계 감사 법원 판결]\n\n${run.data.title}\n등급: ${GRADE_LABELS[run.data.grade]}\n\n${run.data.verdict}\n\n#관계ROI #손익계산`
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(text)
                  alert('클립보드에 복사되었습니다!')
                }
              }}
            >
              공유하기
            </Button>
            <Button
              onClick={() => {
                const text = `[관계 감사 법원 판결]\n\n${run.data.title}\n등급: ${GRADE_LABELS[run.data.grade]}\n\n${run.data.verdict}`
                navigator.clipboard.writeText(text)
                alert('클립보드에 복사되었습니다!')
              }}
            >
              전체 복사
            </Button>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>카카오톡, 인스타 스토리 등에 붙여넣기 하세요.</div>
        </div>
      )}
    </div>
  )
}
