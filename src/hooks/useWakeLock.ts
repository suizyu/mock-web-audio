import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioError, type AudioError } from '../types/audioError'
import { isWakeLockSupported } from '../utils/wakeLockSupport'

export interface UseWakeLockReturn {
  isLocked: boolean
  requestWakeLock: () => Promise<void>
  releaseWakeLock: () => Promise<void>
  isSupported: boolean
  error: AudioError | null
}

/**
 * 画面スリープ防止（Screen Wake Lock API）
 *
 * @example
 * ```tsx
 * const { isSupported, isLocked, requestWakeLock, releaseWakeLock, error } =
 *   useWakeLock();
 *
 * useEffect(() => {
 *   if (isSupported) void requestWakeLock();
 *   return () => { void releaseWakeLock(); };
 * }, [isSupported, requestWakeLock, releaseWakeLock]);
 * ```
 */
export function useWakeLock(): UseWakeLockReturn {
  const isSupported = isWakeLockSupported()
  const [isLocked, setIsLocked] = useState(false)
  const [error, setError] = useState<AudioError | null>(null)

  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  /** ユーザーが明示的にロックを要求した場合のみ、visibility 復帰時に再取得 */
  const wantsLockRef = useRef(false)

  const clearSentinel = useCallback(() => {
    sentinelRef.current = null
    setIsLocked(false)
  }, [])

  const attachReleaseListener = useCallback(
    (sentinel: WakeLockSentinel) => {
      const onRelease = () => {
        clearSentinel()
        // バッテリー低下等で OS が解放した場合 — wantsLock は維持し visible 時に再取得
      }
      sentinel.addEventListener('release', onRelease, { once: true })
    },
    [clearSentinel],
  )

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      const err = createAudioError(
        'NOT_SUPPORTED',
        'Screen Wake Lock API はこのブラウザで利用できません。',
      )
      setError(err)
      throw err
    }

    if (document.visibilityState !== 'visible') {
      wantsLockRef.current = true
      return
    }

    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsLocked(true)
        return
      }

      const sentinel = await navigator.wakeLock!.request('screen')
      sentinelRef.current = sentinel
      wantsLockRef.current = true
      setIsLocked(true)
      setError(null)
      attachReleaseListener(sentinel)
    } catch (unknownError) {
      clearSentinel()
      const err = createAudioError(
        'RUNTIME_ERROR',
        'Wake Lock の取得に失敗しました。',
        unknownError,
      )
      setError(err)
      throw err
    }
  }, [attachReleaseListener, clearSentinel, isSupported])

  const releaseWakeLock = useCallback(async () => {
    wantsLockRef.current = false
    const sentinel = sentinelRef.current
    if (!sentinel || sentinel.released) {
      clearSentinel()
      return
    }

    try {
      await sentinel.release()
    } catch (unknownError) {
      const err = createAudioError(
        'RUNTIME_ERROR',
        'Wake Lock の解放に失敗しました。',
        unknownError,
      )
      setError(err)
      throw err
    } finally {
      clearSentinel()
    }
  }, [clearSentinel])

  useEffect(() => {
    if (!isSupported) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wantsLockRef.current) {
        void requestWakeLock().catch(() => {
          /* requestWakeLock 内で error を設定済み */
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [isSupported, requestWakeLock])

  useEffect(() => {
    return () => {
      const sentinel = sentinelRef.current
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => undefined)
      }
      sentinelRef.current = null
    }
  }, [])

  return {
    isLocked,
    requestWakeLock,
    releaseWakeLock,
    isSupported,
    error,
  }
}
