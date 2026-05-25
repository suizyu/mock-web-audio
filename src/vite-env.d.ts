/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Safari 等の webkit プレフィックス */
interface Window {
  webkitAudioContext?: typeof AudioContext
}
