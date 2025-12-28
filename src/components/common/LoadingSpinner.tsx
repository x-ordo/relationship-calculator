import { useEffect, useState } from 'preact/hooks'
import { LOADING_MESSAGES, COACH_LOADING_MESSAGES } from '../../shared/copy/loadingMessages'

interface LoadingSpinnerProps {
  /** 사용할 메시지 타입 */
  variant?: 'default' | 'coach'
  /** 스피너 색상 */
  color?: 'brand' | 'gold'
  /** 메시지 변경 간격 (ms) */
  interval?: number
}

/**
 * 동적 메시지가 순환하는 로딩 스피너
 * relationship-audit 스타일 흡수
 */
export function LoadingSpinner({
  variant = 'default',
  color = 'brand',
  interval = 2000
}: LoadingSpinnerProps) {
  const messages = variant === 'coach' ? COACH_LOADING_MESSAGES : LOADING_MESSAGES
  const [messageIndex, setMessageIndex] = useState(0)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(true)
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % messages.length)
        setFade(false)
      }, 150)
    }, interval)

    return () => clearInterval(timer)
  }, [messages.length, interval])

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${color === 'gold' ? 'gold' : ''}`} />
      <p className={`loading-message ${fade ? 'fade' : ''}`}>
        {messages[messageIndex]}
      </p>
    </div>
  )
}
