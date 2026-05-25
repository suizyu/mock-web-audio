/**
 * Screen Wake Lock API のサポート確認（テスト時にモック可能）
 */

export function isWakeLockSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    typeof navigator.wakeLock?.request === 'function'
  )
}
