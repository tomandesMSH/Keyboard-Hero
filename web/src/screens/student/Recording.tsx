import { RecordingUI } from '../../components/audio/RecordingUI'

export function Recording() {
  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-xl mb-4">Nahrávání</h1>
      <RecordingUI />
    </div>
  )
}
