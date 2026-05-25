import { useCallback, useState } from 'react'
import type { AudioHooks } from '../types/audioHooks'

/** UI 検証用の仮 hooks（実装差し替えまで使用） */
export function useMockAudioHooks(): AudioHooks {
  const [isRecording, setIsRecording] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const startRecording = useCallback(() => {
    console.log('[audio] startRecording')
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    console.log('[audio] stopRecording')
    setIsRecording(false)
  }, [])

  const uploadFile = useCallback((file: File) => {
    console.log('[audio] uploadFile', { name: file.name, size: file.size, type: file.type })
    setFileName(file.name)
  }, [])

  return {
    startRecording,
    stopRecording,
    isRecording,
    uploadFile,
    fileName,
  }
}
