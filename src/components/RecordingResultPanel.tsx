import DownloadIcon from '@mui/icons-material/Download'
import ReplayIcon from '@mui/icons-material/Replay'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type RecordingResultPanelProps = {
  audioUrl: string
  onSave: () => void
  onDiscard: () => void
}

/** 録音正常終了後のプレビューと任意保存 */
export function RecordingResultPanel({
  audioUrl,
  onSave,
  onDiscard,
}: RecordingResultPanelProps) {
  return (
    <Box className="action-block recording-result" role="region" aria-label="録音結果">
      <Alert severity="success" variant="outlined">
        録音が完了しました。内容を確認のうえ、必要な場合のみ保存してください。
      </Alert>

      <audio controls src={audioUrl} className="recording-result__player" />

      <Stack spacing={1.5}>
        <Button
          type="button"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          startIcon={<DownloadIcon />}
          onClick={onSave}
          aria-label="録音した音声を WAV ファイルとして保存"
        >
          音声ファイルを保存
        </Button>
        <Button
          type="button"
          variant="text"
          color="inherit"
          size="medium"
          fullWidth
          startIcon={<ReplayIcon />}
          onClick={onDiscard}
          aria-label="録音結果を破棄して再度録音する"
        >
          破棄して録音し直す
        </Button>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'center', display: 'block' }}
      >
        保存しない場合、この画面を離れるとプレビューは破棄されます。
      </Typography>
    </Box>
  )
}
