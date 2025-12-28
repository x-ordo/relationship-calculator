import { useState } from 'react'
import { Button, Dialog, DialogSurface, DialogBody, Spinner } from '@fluentui/react-components'
import { requestPayment } from '../../shared/payment/service'
import { isPaymentEnabled } from '../../shared/payment/config'
import type { AppEvent } from '../../state/events'
import type { Plan } from '../../shared/storage/state'

export type UpgradeReason = 'person_limit' | 'entry_limit' | 'layout_locked' | 'ai_coach'

type Props = {
  reason: UpgradeReason
  currentCount?: number
  limit?: number
  onClose: () => void
  dispatch?: (e: AppEvent) => void
}

const REASON_CONFIG: Record<UpgradeReason, {
  title: string
  description: string
  icon: string
}> = {
  person_limit: {
    title: '무료 플랜 한도 도달',
    description: '더 많은 사람을 관리하려면 PLUS로 업그레이드하세요.',
    icon: '👥',
  },
  entry_limit: {
    title: '기록 한도 도달',
    description: '무제한 기록을 원하시면 PLUS로 업그레이드하세요.',
    icon: '📝',
  },
  layout_locked: {
    title: '프리미엄 템플릿',
    description: '이 템플릿은 PLUS 전용입니다.',
    icon: '🎨',
  },
  ai_coach: {
    title: 'AI 판사 기능',
    description: 'AI 판사를 사용하려면 PLUS로 업그레이드하세요.',
    icon: '⚖️',
  },
}

const PLUS_BENEFITS = [
  '10명까지 관리',
  '프리미엄 공유 카드 30종+',
  'AI 판결 3회 포함',
  'PDF 다운로드',
  '월간 리포트',
]

type PaymentState = 'idle' | 'loading' | 'success' | 'error'

export function UpgradeModal({ reason, currentCount, limit, onClose, dispatch }: Props) {
  const config = REASON_CONFIG[reason]
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleUpgrade = async () => {
    if (!isPaymentEnabled()) {
      // 결제 시스템 미설정 시 안내
      setErrorMessage('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.')
      setPaymentState('error')
      return
    }

    setPaymentState('loading')
    setErrorMessage('')

    const result = await requestPayment('plus_lifetime')

    if (result.success) {
      setPaymentState('success')
      // dispatch로 상태 업데이트
      if (dispatch) {
        dispatch({
          type: 'PAYMENT_OK',
          token: result.token,
          plan: result.plan as Plan,
          expiresAt: result.expiresAt,
        })
      }
      // 성공 후 잠시 보여주고 닫기
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setPaymentState('error')
      setErrorMessage(result.error)
    }
  }

  const handleRetry = () => {
    setPaymentState('idle')
    setErrorMessage('')
  }

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && paymentState !== 'loading' && onClose()}>
      <DialogSurface className="sheet" style={{ maxWidth: 400 }}>
        <DialogBody>
          {paymentState === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div className="h2" style={{ margin: 0, color: 'var(--colorStatusSuccessForeground1)' }}>
                업그레이드 완료!
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                PLUS 기능이 활성화되었습니다.
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{config.icon}</div>
                <div className="h2" style={{ margin: 0 }}>{config.title}</div>
                {currentCount !== undefined && limit !== undefined && (
                  <div className="hint" style={{ marginTop: 8 }}>
                    현재 {currentCount}명 / 최대 {limit}명
                  </div>
                )}
              </div>

              <div style={{
                background: 'var(--colorNeutralBackground2)',
                border: '1px solid var(--colorNeutralStroke1)',
                borderRadius: 'var(--borderRadiusLarge)',
                padding: 'var(--spacingM)',
                marginBottom: 20,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>PLUS</div>
                    <div className="hint">평생 이용권</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--colorBrandForeground1)' }}>
                      ₩4,900
                    </div>
                    <div className="hint">1회 결제</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {PLUS_BENEFITS.map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--colorStatusSuccessForeground1)' }}>✓</span>
                      <span style={{ fontSize: 14 }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'var(--colorStatusWarningBackground1)',
                border: '1px solid var(--colorStatusWarningBorder1)',
                borderRadius: 'var(--borderRadiusMedium)',
                padding: 'var(--spacingS) var(--spacingM)',
                marginBottom: 20,
                fontSize: 13,
                textAlign: 'center',
              }}>
                <strong>🎁 런칭 특가</strong> — 정가 ₩9,900 → <strong>₩4,900</strong> (50% 할인)
              </div>

              {paymentState === 'error' && errorMessage && (
                <div style={{
                  background: 'var(--colorStatusDangerBackground1)',
                  border: '1px solid var(--colorStatusDangerBorder1)',
                  borderRadius: 'var(--borderRadiusMedium)',
                  padding: 'var(--spacingS) var(--spacingM)',
                  marginBottom: 16,
                  fontSize: 13,
                  color: 'var(--colorStatusDangerForeground1)',
                }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                {paymentState === 'error' ? (
                  <Button appearance="primary" onClick={handleRetry} style={{ width: '100%' }}>
                    다시 시도
                  </Button>
                ) : (
                  <Button
                    appearance="primary"
                    onClick={handleUpgrade}
                    disabled={paymentState === 'loading'}
                    style={{ width: '100%' }}
                  >
                    {paymentState === 'loading' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spinner size="tiny" />
                        결제 처리 중...
                      </span>
                    ) : (
                      '₩4,900에 업그레이드'
                    )}
                  </Button>
                )}
                <Button
                  appearance="subtle"
                  onClick={onClose}
                  disabled={paymentState === 'loading'}
                  style={{ width: '100%' }}
                >
                  나중에
                </Button>
              </div>

              <div className="hint" style={{ textAlign: 'center', marginTop: 16, fontSize: 11 }}>
                결제 후 즉시 활성화 · 환불 정책 적용
              </div>
            </>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
