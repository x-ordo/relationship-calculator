import { useEffect, useRef } from 'react'

type SwipeDirection = 'left' | 'right'

type UseSwipeOptions = {
  onSwipe: (direction: SwipeDirection) => void
  threshold?: number // minimum distance in px
  enabled?: boolean
}

/**
 * 스와이프 제스처 감지 훅
 * 좌우 스와이프로 탭 전환에 사용
 */
export function useSwipe(options: UseSwipeOptions) {
  const { onSwipe, threshold = 50, enabled = true } = options
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = endX - startX.current
      const diffY = endY - startY.current

      // 수직 스크롤이 더 큰 경우 무시 (세로 스크롤과 충돌 방지)
      if (Math.abs(diffY) > Math.abs(diffX)) {
        startX.current = null
        startY.current = null
        return
      }

      if (Math.abs(diffX) >= threshold) {
        onSwipe(diffX > 0 ? 'right' : 'left')
      }

      startX.current = null
      startY.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipe, threshold, enabled])
}
