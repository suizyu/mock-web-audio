/** 音声・Wake Lock 関連 hooks で共通利用するエラーコード */
export type AudioErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'RUNTIME_ERROR'

/** 共通エラー型（仕様準拠） */
export interface AudioError extends Error {
  code: AudioErrorCode
  originalError?: unknown
}

export function createAudioError(
  code: AudioErrorCode,
  message: string,
  originalError?: unknown,
): AudioError {
  const err = new Error(message) as AudioError
  err.name = 'AudioError'
  err.code = code
  if (originalError !== undefined) {
    err.originalError = originalError
  }
  return err
}

/** DOMException 等から PERMISSION_DENIED を判定 */
export function isPermissionDeniedError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'NotAllowedError' ||
      error.name === 'PermissionDeniedError'
    )
  }
  return false
}
