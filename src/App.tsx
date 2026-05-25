import { useState } from 'react'
import { AudioLandingPage } from './components/AudioLandingPage'
import { useRecordingSession } from './hooks/useRecordingSession'

function App() {
  const recording = useRecordingSession()
  const [fileName, setFileName] = useState<string | null>(null)

  const uploadFile = (file: File) => {
    setFileName(file.name)
  }

  return (
    <AudioLandingPage
      recording={recording}
      uploadFile={uploadFile}
      fileName={fileName}
    />
  )
}

export default App
