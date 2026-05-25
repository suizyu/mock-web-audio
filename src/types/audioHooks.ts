/** カスタム hooks 実装時に差し替える想定のインターフェース */
export interface AudioHooks {
  startRecording: () => void
  stopRecording: () => void
  isRecording: boolean
  uploadFile: (file: File) => void
  fileName: string | null
}
