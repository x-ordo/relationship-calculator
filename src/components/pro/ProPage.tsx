/** @jsxImportSource preact */
import type { AppState } from '../../state/state'
import type { AppEvent } from '../../state/events'
import { PRODUCTS, type ProductId } from '../../shared/payment/portone'

type Actions = {
  unlockPro: (code: string) => any
  purchasePro: (productId: ProductId) => any
}

function formatExpiry(expiresAt: string | undefined): string {
  if (!expiresAt) return ''
  try {
    const d = new Date(expiresAt)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

export function ProPage({ state, dispatch, actions }: { state: AppState; dispatch: (e: AppEvent) => void; actions: Actions }) {
  const token = state.domain.entitlement?.token || ''
  const expiresAt = state.domain.entitlement?.expiresAt
  const paid = state.domain.plan === 'paid'

  const unlock = state.proUi.unlock
  const payment = state.proUi.payment
  const code = state.proUi.unlockCode

  const isLoading = unlock.status === 'loading' || payment.status === 'loading'

  return (
    <div class="page">
      <div class="h1">PRO</div>

      {/* 현재 상태 */}
      <div class="callout" style={{ background: paid ? 'var(--colorStatusSuccessBackground1)' : 'var(--colorNeutralBackground3)' }}>
        <div style={{ fontWeight: 900, fontSize: 'var(--fontSizeBase400)' }}>
          {paid ? 'PRO 활성화됨' : 'FREE 플랜'}
        </div>
        {paid && token && (
          <div class="hint" style={{ marginTop: 6 }}>
            토큰: {token.slice(0, 8)}...{token.slice(-4)}
          </div>
        )}
        {paid && expiresAt && (
          <div class="hint">
            만료: {formatExpiry(expiresAt)}
          </div>
        )}
        {!paid && (
          <div class="hint" style={{ marginTop: 6 }}>
            PRO로 업그레이드하면 AI 판사 기능을 무제한으로 사용할 수 있습니다.
          </div>
        )}
      </div>

      {/* 결제 섹션 */}
      {!paid && (
        <>
          <div class="h2" style={{ marginTop: 20 }}>PRO 구매</div>
          <div class="grid" style={{ marginTop: 10 }}>
            {Object.values(PRODUCTS).map(product => (
              <div
                class="card"
                style={{
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  border: product.id === 'pro_yearly' ? '2px solid var(--colorBrandForeground1)' : undefined,
                }}
                onClick={() => !isLoading && actions.purchasePro(product.id)}
              >
                {product.id === 'pro_yearly' && (
                  <div style={{
                    fontSize: 'var(--fontSizeBase100)',
                    color: 'var(--colorBrandForeground1)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    BEST
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 'var(--fontSizeBase400)' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 'var(--fontSizeBase500)', fontWeight: 900, marginTop: 4 }}>
                  ₩{product.price.toLocaleString()}
                </div>
                <div class="hint" style={{ marginTop: 6 }}>
                  {product.description}
                </div>
              </div>
            ))}
          </div>

          {payment.status === 'loading' && (
            <div class="callout" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>결제 진행 중...</div>
              <div class="hint">결제창이 열립니다. 완료할 때까지 기다려주세요.</div>
            </div>
          )}

          {payment.status === 'error' && (
            <div class="callout danger" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900 }}>결제 실패</div>
              <div class="hint">{payment.error}</div>
              <button
                class="btn ghost"
                style={{ marginTop: 8 }}
                onClick={() => dispatch({ type: 'PAYMENT_RESET' })}
              >
                다시 시도
              </button>
            </div>
          )}

          {payment.status === 'success' && (
            <div class="callout" style={{ marginTop: 12, background: 'var(--colorStatusSuccessBackground1)' }}>
              <div style={{ fontWeight: 900 }}>결제 완료</div>
              <div class="hint">PRO가 활성화되었습니다. 코치 탭에서 AI 판사를 이용해보세요.</div>
            </div>
          )}
        </>
      )}

      {/* 언락 코드 섹션 (테스터/프로모션용) */}
      <div class="h2" style={{ marginTop: 20 }}>언락 코드</div>
      <div class="hint" style={{ marginBottom: 8 }}>
        프로모션 코드가 있다면 입력하세요.
      </div>
      <div class="row" style={{ marginTop: 8 }}>
        <input
          class="input"
          placeholder="예: PRO-XXXX-XXXX"
          value={code}
          disabled={isLoading}
          onInput={(e) => dispatch({ type: 'PRO_CODE', code: (e.currentTarget as HTMLInputElement).value })}
        />
        <button
          class="btn"
          disabled={isLoading || !code.trim()}
          onClick={() => actions.unlockPro(code.trim())}
        >
          {unlock.status === 'loading' ? '확인 중...' : '언락'}
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
          <div class="hint">PRO가 활성화되었습니다.</div>
        </div>
      )}

      {/* 관리 섹션 */}
      {paid && (
        <>
          <div class="h2" style={{ marginTop: 20 }}>관리</div>
          <div class="row" style={{ marginTop: 8 }}>
            <button class="btn ghost" onClick={() => dispatch({ type: 'TOKEN_UNSET' })}>
              FREE로 전환 (토큰 제거)
            </button>
          </div>
        </>
      )}

      <div class="hint" style={{ marginTop: 20, padding: 12, background: 'var(--colorNeutralBackground2)', borderRadius: 'var(--borderRadiusMedium)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>PRO 이용 안내</div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>PRO 활성화 시 AI 판사 요청이 서버로 전송됩니다.</li>
          <li>입력 텍스트는 PII 마스킹 후 전송됩니다.</li>
          <li>결제 관련 문의: support@example.com</li>
        </ul>
      </div>
    </div>
  )
}
