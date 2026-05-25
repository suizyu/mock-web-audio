import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioError, type AudioError } from '../types/audioError'
import { useAudioRecorder } from './useAudioRecorder'
import { useWakeLock } from './useWakeLock'

/** 録音の最大継続時間（超過時は自動停止し Wake Lock を解除） */
export const RECORDING_TIMEOUT_MS = 10 * 60 * 1000

export interface UseRecordingSessionReturn {
  isRecording: boolean
  isWakeLockActive: boolean
  isWakeLockSupported: boolean
  error: AudioError | null
  audioUrl: string | null
  hasRecording: boolean
  isBusy: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  saveRecording: (filename?: string) => void
  clearRecording: () => void
}

/**
 * 録音 + Wake Lock + タイムアウトをまとめて制御する hook
 *
 * - 録音開始成功 → Wake Lock 取得
 * - 録音失敗 / エラー / タイムアウト → Wake Lock 解除
 * - 正常終了 → プレビュー表示（保存は saveRecording で任意実行）
 */
export function useRecordingSession(): UseRecordingSessionReturn {
  const recorder = useAudioRecorder()
  const wakeLock = useWakeLock()

  const [sessionError, setSessionError] = useState<AudioError | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimeoutTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const releaseWakeLockSafe = useCallback(async () => {
    if (!wakeLock.isLocked) return
    try {
      await wakeLock.releaseWakeLock()
    } catch {
      /* release 失敗時も UI は続行 */
    }
  }, [wakeLock])

  const handleFailure = useCallback(
    async (err: AudioError) => {
      clearTimeoutTimer()
      setSessionError(err)
      setHasRecording(false)

      if (recorder.isRecording) {
        try {
          await recorder.stopRecording()
        } catch {
          /* 停止失敗は recorder.error に委ねる */
        }
      }

      await releaseWakeLockSafe()
    },
    [clearTimeoutTimer, recorder, releaseWakeLockSafe],
  )

  const startRecording = useCallback(async () => {
    setSessionError(null)
    setHasRecording(false)
    clearTimeoutTimer()
    setIsBusy(true)

    try {
      await recorder.startRecording()

      if (wakeLock.isSupported) {
        try {
          await wakeLock.requestWakeLock()
        } catch (wakeErr) {
          await handleFailure(
            wakeErr instanceof Error && 'code' in wakeErr
              ? (wakeErr as AudioError)
              : createAudioError(
                  'RUNTIME_ERROR',
                  '画面ロックの取得に失敗したため、録音を中止しました。',
                  wakeErr,
                ),
          )
          return
        }
      }

      timeoutRef.current = setTimeout(() => {
        void (async () => {
          const timeoutError = createAudioError(
            'RUNTIME_ERROR',
            `録音がタイムアウトしました（最大 ${RECORDING_TIMEOUT_MS / 60_000} 分）。`,
          )
          await handleFailure(timeoutError)
        })()
      }, RECORDING_TIMEOUT_MS)
    } catch (startErr) {
      const err =
        startErr instanceof Error && 'code' in startErr
          ? (startErr as AudioError)
          : createAudioError(
              'RUNTIME_ERROR',
              '録音の開始に失敗しました。',
              startErr,
            )
      await handleFailure(err)
    } finally {
      setIsBusy(false)
    }
  }, [
    clearTimeoutTimer,
    handleFailure,
    recorder,
    wakeLock,
  ])

  const stopRecording = useCallback(async () => {
    clearTimeoutTimer()
    setIsBusy(true)

    try {
      const blob = await recorder.stopRecording()
      await releaseWakeLockSafe()

      if (blob) {
        setHasRecording(true)
        setSessionError(null)
      } else {
        setHasRecording(false)
        const err =
          recorder.error ??
          createAudioError('RUNTIME_ERROR', '録音データを取得できませんでした。')
        setSessionError(err)
      }
    } catch (stopErr) {
      const err =
        stopErr instanceof Error && 'code' in stopErr
          ? (stopErr as AudioError)
          : createAudioError('RUNTIME_ERROR', '録音の停止に失敗しました。', stopErr)
      await handleFailure(err)
    } finally {
      setIsBusy(false)
    }
  }, [clearTimeoutTimer, handleFailure, recorder, releaseWakeLockSafe])

  const saveRecording = useCallback(
    (filename = 'recording.wav') => {
      recorder.downloadAudio(filename)
    },
    [recorder],
  )

  const clearRecording = useCallback(() => {
    setHasRecording(false)
    setSessionError(null)
    recorder.resetRecording()
  }, [recorder])

  useEffect(() => {
    return () => {
      clearTimeoutTimer()
      void releaseWakeLockSafe()
    }
  }, [clearTimeoutTimer, releaseWakeLockSafe])

  const error = sessionError ?? recorder.error ?? wakeLock.error

  return {
    isRecording: recorder.isRecording,
    isWakeLockActive: wakeLock.isLocked,
    isWakeLockSupported: wakeLock.isSupported,
    error,
    audioUrl: recorder.audioUrl,
    hasRecording,
    isBusy,
    startRecording,
    stopRecording,
    saveRecording,
    clearRecording,
  }
}
