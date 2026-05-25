import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import type { UseRecordingSessionReturn } from '../hooks/useRecordingSession'
import { RecordButton } from './RecordButton'
import { RecordingResultPanel } from './RecordingResultPanel'

type RecordingControlsProps = Pick<
  UseRecordingSessionReturn,
  | 'isRecording'
  | 'isBusy'
  | 'isWakeLockActive'
  | 'isWakeLockSupported'
  | 'error'
  | 'audioUrl'
  | 'hasRecording'
  | 'startRecording'
  | 'stopRecording'
  | 'saveRecording'
  | 'clearRecording'
>

export function RecordingControls({
  isRecording,
  isBusy,
  isWakeLockActive,
  isWakeLockSupported,
  error,
  audioUrl,
  hasRecording,
  startRecording,
  stopRecording,
  saveRecording,
  clearRecording,
}: RecordingControlsProps) {
  const showResult = hasRecording && audioUrl && !isRecording

  return (
    <StackLike>
      {error && (
        <Alert severity="error" role="alert">
          {error.message}
        </Alert>
      )}

      {!showResult && (
        <RecordButton
          isRecording={isRecording}
          isBusy={isBusy}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />
      )}

      {isRecording && isWakeLockSupported && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block' }}
        >
          {isWakeLockActive
            ? '画面スリープを防止しています'
            : '画面ロックを取得しています…'}
        </Typography>
      )}

      {showResult && (
        <RecordingResultPanel
          audioUrl={audioUrl}
          onSave={() => saveRecording()}
          onDiscard={clearRecording}
        />
      )}
    </StackLike>
  )
}

/** MUI Stack の代わりに gap のみ（既存 landing spacing と二重にならないよう親に任せる） */
function StackLike({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {children}
    </Box>
  )
}
