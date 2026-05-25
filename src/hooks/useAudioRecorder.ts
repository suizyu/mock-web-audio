import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createAudioError,
  isPermissionDeniedError,
  type AudioError,
} from '../types/audioError'
import { isAudioRecorderSupported } from '../utils/audioRecorderSupport'
import {
  RECORDER_WORKLET_PROCESSOR_NAME,
  RECORDER_WORKLET_SOURCE,
} from '../utils/recorderWorklet'
import { encodeFloat32ToWav, mergeFloat32Chunks } from '../utils/wavEncoder'

/** 推奨サンプルレート（ブラウザが別レートを選ぶ場合は実際の context.sampleRate を使用） */
const TARGET_SAMPLE_RATE = 44100

export interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  isRecording: boolean
  error: AudioError | null
  audioUrl: string | null
  downloadAudio: (filename?: string) => void
  resetRecording: () => void
}

/**
 * マイク録音 → WAV（PCM 16bit）保存用 hook
 *
 * @example
 * ```tsx
 * const { startRecording, stopRecording, isRecording, audioUrl, downloadAudio, error } =
 *   useAudioRecorder();
 *
 * const onToggle = async () => {
 *   if (isRecording) {
 *     const blob = await stopRecording();
 *     if (blob) downloadAudio('recording.wav');
 *   } else {
 *     await startRecording();
 *   }
 * };
 * {audioUrl && <audio src={audioUrl} controls />}
 * ```
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<AudioError | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const chunksRef = useRef<Float32Array[]>([])
  const lastBlobRef = useRef<Blob | null>(null)
  const workletModuleUrlRef = useRef<string | null>(null)
  const isRecordingRef = useRef(false)

  const revokeAudioUrl = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const cleanupRecordingResources = useCallback(async () => {
    workletNodeRef.current?.port.close()
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null

    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null

    const ctx = audioContextRef.current
    audioContextRef.current = null
    if (ctx && ctx.state !== 'closed') {
      await ctx.close()
    }

    if (workletModuleUrlRef.current) {
      URL.revokeObjectURL(workletModuleUrlRef.current)
      workletModuleUrlRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return

    setError(null)
    revokeAudioUrl()
    setAudioUrl(null)
    lastBlobRef.current = null
    chunksRef.current = []

    if (!isAudioRecorderSupported()) {
      const err = createAudioError(
        'NOT_SUPPORTED',
        'このブラウザは録音に必要な API（MediaDevices / AudioContext / AudioWorklet）に対応していません。',
      )
      setError(err)
      throw err
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext
      if (!AudioContextCtor) {
        throw createAudioError('NOT_SUPPORTED', 'AudioContext が利用できません。')
      }

      const audioContext = new AudioContextCtor({
        sampleRate: TARGET_SAMPLE_RATE,
      })
      audioContextRef.current = audioContext

      const moduleUrl = URL.createObjectURL(
        new Blob([RECORDER_WORKLET_SOURCE], { type: 'application/javascript' }),
      )
      workletModuleUrlRef.current = moduleUrl
      await audioContext.audioWorklet.addModule(moduleUrl)

      const workletNode = new AudioWorkletNode(
        audioContext,
        RECORDER_WORKLET_PROCESSOR_NAME,
      )
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (event.data instanceof Float32Array) {
          chunksRef.current.push(event.data)
        }
      }

      const source = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = source
      source.connect(workletNode)

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      isRecordingRef.current = true
      setIsRecording(true)
    } catch (unknownError) {
      await cleanupRecordingResources()
      isRecordingRef.current = false
      setIsRecording(false)

      const err = isPermissionDeniedError(unknownError)
        ? createAudioError(
            'PERMISSION_DENIED',
            'マイクの使用が許可されていません。ブラウザの設定でマイク権限を確認してください。',
            unknownError,
          )
        : unknownError instanceof Error && 'code' in unknownError
          ? (unknownError as AudioError)
          : createAudioError(
              'RUNTIME_ERROR',
              '録音の開始に失敗しました。',
              unknownError,
            )

      setError(err)
      throw err
    }
  }, [cleanupRecordingResources, revokeAudioUrl])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!isRecordingRef.current) {
      return lastBlobRef.current
    }

    isRecordingRef.current = false
    setIsRecording(false)

    const sampleRate = audioContextRef.current?.sampleRate ?? TARGET_SAMPLE_RATE
    const merged = mergeFloat32Chunks(chunksRef.current)
    chunksRef.current = []

    await cleanupRecordingResources()

    if (merged.length === 0) {
      const err = createAudioError(
        'RUNTIME_ERROR',
        '録音データが空です。マイク入力を確認してください。',
      )
      setError(err)
      return null
    }

    try {
      const wavBlob = encodeFloat32ToWav(merged, sampleRate, 1)
      lastBlobRef.current = wavBlob

      revokeAudioUrl()
      const url = URL.createObjectURL(wavBlob)
      setAudioUrl(url)

      return wavBlob
    } catch (unknownError) {
      const err = createAudioError(
        'RUNTIME_ERROR',
        'WAV への変換に失敗しました。',
        unknownError,
      )
      setError(err)
      return null
    }
  }, [cleanupRecordingResources, revokeAudioUrl])

  const resetRecording = useCallback(() => {
    revokeAudioUrl()
    setAudioUrl(null)
    lastBlobRef.current = null
    setError(null)
  }, [revokeAudioUrl])

  const downloadAudio = useCallback((filename = 'recording.wav') => {
    const blob = lastBlobRef.current
    if (!blob) {
      const err = createAudioError(
        'RUNTIME_ERROR',
        'ダウンロード可能な録音データがありません。先に stopRecording を実行してください。',
      )
      setError(err)
      return
    }

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => {
      void cleanupRecordingResources()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl, cleanupRecordingResources])

  return {
    startRecording,
    stopRecording,
    isRecording,
    error,
    audioUrl,
    downloadAudio,
    resetRecording,
  }
}
