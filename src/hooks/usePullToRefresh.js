import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh, containerRef) {
  const [pulling, setPulling] = useState(false)
  const [progress, setProgress] = useState(0)
  const startY = useRef(0)
  const threshold = 80

  useEffect(() => {
    const el = containerRef?.current
    if (!el) return

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const onTouchMove = (e) => {
      if (startY.current === 0) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && el.scrollTop === 0) {
        setPulling(true)
        setProgress(Math.min(delta / threshold, 1))
        if (delta > 10) e.preventDefault()
      }
    }

    const onTouchEnd = () => {
      if (progress >= 1) onRefresh()
      setPulling(false)
      setProgress(0)
      startY.current = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh, progress, containerRef])

  return { pulling, progress }
}
