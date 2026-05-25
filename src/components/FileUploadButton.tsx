import UploadFileIcon from '@mui/icons-material/UploadFile'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useRef, type ChangeEvent } from 'react'
import type { AudioHooks } from '../types/audioHooks'

const ACCEPT_AUDIO =
  'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a'

type FileUploadButtonProps = Pick<AudioHooks, 'uploadFile' | 'fileName'>

export function FileUploadButton({ uploadFile, fileName }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    event.target.value = ''
  }

  return (
    <Box className="action-block">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_AUDIO}
        onChange={handleFileChange}
        className="file-input-hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outlined"
        color="primary"
        size="large"
        fullWidth
        onClick={handleButtonClick}
        aria-label="音声ファイルを選択"
        startIcon={<UploadFileIcon />}
      >
        ファイルを選択
      </Button>
      <Typography
        variant="body2"
        color="text.secondary"
        className="file-name"
        aria-live="polite"
      >
        {fileName ? (
          <>
            選択中: <span className="file-name__value">{fileName}</span>
          </>
        ) : (
          '未選択（.mp3 / .wav / .m4a など）'
        )}
      </Typography>
    </Box>
  )
}
