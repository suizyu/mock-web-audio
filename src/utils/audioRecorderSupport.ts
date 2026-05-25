/**
 * 録音に必要なブラウザ API のサポート確認（テスト時にモック可能）
 *
 * 注意: MediaRecorder は仕様上の利用 API だが、WAV MIME はほぼ未対応のため
 * 実録音は Web Audio API（AudioWorklet）で PCM を取得し WAV にエンコードする。
 */

export function isMediaDevicesSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

export function isAudioContextSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || window.webkitAudioContext)
}

export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined'
}

/** 録音 hook が動作する最低条件 */
export function isAudioRecorderSupported(): boolean {
  return (
    isMediaDevicesSupported() &&
    isAudioContextSupported() &&
    typeof AudioWorkletNode !== 'undefined'
  )
}
