import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { UseRecordingSessionReturn } from '../hooks/useRecordingSession'
import type { AudioHooks } from '../types/audioHooks'
import { FileUploadButton } from './FileUploadButton'
import { RecordingControls } from './RecordingControls'
import '../App.css'

type AudioLandingPageProps = {
  recording: UseRecordingSessionReturn
} & Pick<AudioHooks, 'uploadFile' | 'fileName'>

export function AudioLandingPage({
  recording,
  uploadFile,
  fileName,
}: AudioLandingPageProps) {
  return (
    <Box component="main" className="landing">
      <Container maxWidth={false} className="landing__container" disableGutters>
        <header className="landing__hero">
          <Typography variant="h1" component="h1" className="landing__title">
            音声処理
          </Typography>
          <Typography variant="body1" color="text.secondary" className="landing__lead">
            マイク録音または音声ファイルのアップロードで、技術検証を行います。
          </Typography>
        </header>

        <section className="landing__actions" aria-label="音声入力">
          <Stack spacing={2.5}>
            <RecordingControls {...recording} />
            <FileUploadButton uploadFile={uploadFile} fileName={fileName} />
          </Stack>
        </section>

        <footer className="landing__footer">
          <Typography variant="body2" color="text.secondary">
            技術検証用 PWA — オンライン専用
          </Typography>
        </footer>
      </Container>
    </Box>
  )
}
