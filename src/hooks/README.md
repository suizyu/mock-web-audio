# カスタム Hooks（音声録音・Wake Lock）

## useAudioRecorder

マイク入力を **WAV（PCM 16bit）** として取得・プレビュー・ダウンロードする hook。

### 使用例

```tsx
import { useAudioRecorder } from './hooks/useAudioRecorder';

function RecorderPanel() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioUrl,
    downloadAudio,
    error,
  } = useAudioRecorder();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isRecording) {
            void stopRecording().then((blob) => {
              if (blob) downloadAudio('memo.wav');
            });
          } else {
            void startRecording();
          }
        }}
      >
        {isRecording ? '停止' : '録音'}
      </button>
      {audioUrl && <audio src={audioUrl} controls />}
      {error && <p role="alert">{error.message}</p>}
    </div>
  );
}
```

### 制限・注意点

| 項目 | 内容 |
|------|------|
| **MediaRecorder と WAV** | 仕様では MediaRecorder も対象だが、多くのブラウザは `audio/wav` をサポートしない。本実装は **Web Audio API（AudioWorklet）で PCM を取得**し、`wavEncoder` で WAV に変換する。 |
| **サンプルレート** | 44.1kHz を要求するが、端末の AudioContext が別レート（例: 48kHz）を選ぶ場合がある。その場合は **実際の `audioContext.sampleRate`** で WAV を生成する。 |
| **HTTPS** | `getUserMedia` は **secure context（HTTPS または localhost）** が必要。 |
| **iOS Safari** | AudioWorklet は比較的新しい機能。未対応環境では `NOT_SUPPORTED` エラーとなる。 |
| **モノラル** | 現状はチャンネル 0 のみを WAV に書き込む（ステレオマイクは左チャンネル相当）。 |
| **メモリ** | 長時間録音は `chunksRef` に Float32 が蓄積される。長時間用途ではチャンク上限やストリーミング保存の検討が必要。 |

### 代替案（コメント）

- **MediaRecorder + サーバー変換**: クライアントは webm で録音し、サーバーで WAV 変換。
- **ffmpeg.wasm**: ブラウザ内でフォーマット変換（バンドルサイズ増）。
- **AudioWorklet ファイル分離**: 本実装は Blob URL で worklet を登録。ビルド時に `?url` で静的ファイル化すると CSP と相性が良い場合がある。

---

## useWakeLock

Screen Wake Lock API で画面の自動スリープを抑止する hook。

### 使用例

```tsx
import { useEffect } from 'react';
import { useWakeLock } from './hooks/useWakeLock';

function RecordingSession() {
  const { isSupported, isLocked, requestWakeLock, releaseWakeLock, error } =
    useWakeLock();

  useEffect(() => {
    if (!isSupported) return;
    void requestWakeLock();
    return () => {
      void releaseWakeLock();
    };
  }, [isSupported, requestWakeLock, releaseWakeLock]);

  return (
    <p>
      {isSupported
        ? isLocked
          ? '画面ロック中'
          : 'ロック未取得'
        : 'Wake Lock 非対応'}
      {error && <span role="alert"> — {error.message}</span>}
    </p>
  );
}
```

### 制限・注意点

| 項目 | 内容 |
|------|------|
| **ブラウザ** | Chrome / Edge / Safari（比較的新しい版）など。Firefox は状況により未対応。 |
| **タブ非表示** | タブが hidden になるとロックは **自動解放**される。`visibilitychange` で visible 復帰時に **ユーザーが要求済み（`wantsLockRef`）なら再取得**する。 |
| **バッテリー** | 低電力モード等で OS が `release` イベントを発火する。`isLocked` は false になるが、`requestWakeLock` を再度呼べば再取得可能。 |
| **Fullscreen 等** | 一部環境では Fullscreen やユーザー操作が必要な場合がある。 |
| **PWA** | インストール済み PWA でも **表示中の Web コンテンツ** として動作（ネイティブ常時点灯とは別）。 |

### テスト

- `isWakeLockSupported()` / `isAudioRecorderSupported()` をユーティリティからモックし、hooks の分岐を検証できる。
