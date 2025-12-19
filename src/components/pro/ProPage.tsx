/** @jsxImportSource preact */
import type { AppState } from '../../state/state'
import type { AppEvent } from '../../state/events'

type Actions = {
  unlockPro: (code: string) => any
}

export function ProPage({ state, dispatch, actions }: { state: AppState; dispatch: (e: AppEvent) => void; actions: Actions }) {
  const token = state.domain.entitlement?.token || ''
  const paid = state.domain.plan === 'paid'

  const unlock = state.proUi.unlock
  const code = state.proUi.unlockCode

  const unlockLabel =
    unlock.status === 'loading'
      ? '언락 중...'
      : '언락'

  return (
    <div class="page">
      <div class="h1">PRO</div>

      <div class="callout">
        <div style={{ fontWeight: 900 }}>상태: {paid ? 'PRO' : 'FREE'}</div>
        <div class="hint">토큰: {token ? `${token.slice(0, 6)}...${token.slice(-4)}` : '(없음)'}</div>
        <div class="hint" style={{ marginTop: 6 }}>
          PRO는 서버 호출(LLM) 비용이 발생하므로, <b>언락 코드</b>를 통해서만 활성화됩니다.
        </div>
      </div>

      <div class="h2" style={{ marginTop: 16 }}>언락 코드</div>
      <div class="row" style={{ marginTop: 8 }}>
        <input
          class="input"
          placeholder="예: PRO-XXXX-XXXX"
          value={code}
          onInput={(e) => dispatch({ type: 'PRO_CODE', code: (e.currentTarget as HTMLInputElement).value })}
        />
        <button class="btn" disabled={unlock.status === 'loading' || !code.trim()} onClick={() => actions.unlockPro(code.trim())}>
          {unlockLabel}
        </button>
      </div>

      {unlock.status === 'error' && (
        <div class="callout danger" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>언락 실패</div>
          <div class="hint">{unlock.error}</div>
        </div>
      )}

      {unlock.status === 'success' && (
        <div class="callout" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>언락 완료</div>
          <div class="hint">토큰이 저장됐습니다. 코치 탭에서 PRO 모드로 동작합니다.</div>
          <div class="hint">token: {unlock.data.token}</div>
        </div>
      )}

      <div class="h2" style={{ marginTop: 16 }}>관리</div>
      <div class="row" style={{ marginTop: 8 }}>
        <button class="btn ghost" onClick={() => dispatch({ type: 'TOKEN_UNSET' })}>FREE로 전환(토큰 제거)</button>
        <button class="btn ghost" onClick={() => { dispatch({ type: 'PRO_CODE', code: '' }) }}>코드 지우기</button>
      </div>

      <div class="hint" style={{ marginTop: 12 }}>
        주의: PRO 활성화 시 코치 요청(상황 텍스트+요약된 리포트)이 서버로 전송됩니다. 입력 텍스트는 PII 마스킹 후 전송됩니다.
      </div>
    </div>
  )
}
