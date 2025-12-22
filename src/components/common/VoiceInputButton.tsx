/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks'
import { useSpeechRecognition } from '../../shared/hooks/useSpeechRecognition'

type Props = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onTranscript, disabled }: Props) {
  const {
    isSupported,
    state,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition()

  // Send transcript to parent when recording stops
  useEffect(() => {
    if (state === 'idle' && transcript) {
      onTranscript(transcript)
      reset()
    }
  }, [state, transcript, onTranscript, reset])

  if (!isSupported) {
    return null // Hide button if not supported
  }

  const isListening = state === 'listening'

  return (
    <div class="voice-input-container" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        class={`btn ${isListening ? 'primary' : 'subtle'}`}
        onClick={() => {
          if (isListening) {
            stop()
          } else {
            start()
          }
        }}
        disabled={disabled}
        title={isListening ? '녹음 중지' : '음성 입력'}
        style={{
          position: 'relative',
          minWidth: 40,
          animation: isListening ? 'pulse 1.5s infinite' : undefined,
        }}
      >
        {isListening ? '🔴' : '🎤'}
      </button>

      {/* Interim transcript display */}
      {isListening && interimTranscript && (
        <span class="hint" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {interimTranscript}...
        </span>
      )}

      {/* Error display */}
      {error && (
        <span class="hint" style={{ color: 'var(--colorStatusDangerForeground1)' }}>
          {error}
        </span>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
