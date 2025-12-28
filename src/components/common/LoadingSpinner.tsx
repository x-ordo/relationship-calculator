import { useEffect, useState } from 'react'
import { Spinner } from '@fluentui/react-components'
import { LOADING_MESSAGES, COACH_LOADING_MESSAGES } from '../../shared/copy/loadingMessages'

interface LoadingSpinnerProps {
  variant?: 'default' | 'coach'
  color?: 'brand' | 'gold'
  interval?: number
}

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
      <Spinner
        size="large"
        style={{ color: color === 'gold' ? 'var(--colorAuditGold)' : undefined }}
      />
      <p className={`loading-message ${fade ? 'fade' : ''}`}>
        {messages[messageIndex]}
      </p>
    </div>
  )
}
