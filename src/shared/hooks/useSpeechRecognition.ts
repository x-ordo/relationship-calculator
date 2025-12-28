import { useState, useEffect, useCallback, useRef } from 'react'

// Web Speech API types (not fully standardized)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: Event & { error: string }) => void
  onend: () => void
  onstart: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export type SpeechRecognitionState = 'idle' | 'listening' | 'error'

export type UseSpeechRecognitionResult = {
  isSupported: boolean
  state: SpeechRecognitionState
  transcript: string
  interimTranscript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

/**
 * Web Speech API를 사용한 음성 인식 훅
 * 한국어(ko-KR)로 설정됨
 */
export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isSupported, setIsSupported] = useState(false)
  const [state, setState] = useState<SpeechRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognitionAPI)

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ko-KR'

      recognition.onstart = () => {
        setState('listening')
        setError(null)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interim = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
        setInterimTranscript(interim)
      }

      recognition.onerror = (event) => {
        const errorMessages: Record<string, string> = {
          'no-speech': '음성이 감지되지 않았습니다.',
          'audio-capture': '마이크를 찾을 수 없습니다.',
          'not-allowed': '마이크 권한이 필요합니다.',
          'network': '네트워크 오류가 발생했습니다.',
          'aborted': '음성 인식이 중단되었습니다.',
        }
        setError(errorMessages[event.error] || `오류: ${event.error}`)
        setState('error')
      }

      recognition.onend = () => {
        if (state === 'listening') {
          setState('idle')
        }
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current && state !== 'listening') {
      setError(null)
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Already started
      }
    }
  }, [state])

  const stop = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
      setState('idle')
    }
  }, [state])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setState('idle')
  }, [])

  return {
    isSupported,
    state,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  }
}
