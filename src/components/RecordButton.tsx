import MicIcon from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

type RecordButtonProps = {
  isRecording: boolean
  isBusy?: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export function RecordButton({
  isRecording,
  isBusy = false,
  startRecording,
  stopRecording,
}: RecordButtonProps) {
  const handleClick = () => {
    if (isBusy) return
    if (isRecording) {
      void stopRecording()
    } else {
      void startRecording()
    }
  }

  return (
    <Box className="action-block">
      <Button
        type="button"
        variant="contained"
        color={isRecording ? 'error' : 'primary'}
        size="large"
        fullWidth
        disabled={isBusy}
        onClick={handleClick}
        aria-pressed={isRecording}
        aria-busy={isBusy}
        aria-label={isRecording ? '録音を停止' : '録音を開始'}
        className={`record-button${isRecording ? ' record-button--active' : ''}`}
        startIcon={
          isBusy ? (
            <CircularProgress size={20} color="inherit" aria-hidden="true" />
          ) : isRecording ? (
            <StopIcon />
          ) : (
            <MicIcon />
          )
        }
      >
        {isBusy ? '処理中…' : isRecording ? '録音を停止' : '録音を開始'}
      </Button>
      {isRecording && (
        <Box className="recording-indicator" aria-live="polite">
          <span className="recording-indicator__dot" aria-hidden="true" />
          <Typography variant="body2" component="span" color="error">
            録音中
          </Typography>
        </Box>
      )}
    </Box>
  )
}
