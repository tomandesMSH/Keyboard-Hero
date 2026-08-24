import { AudioPlayer } from '../../components/audio/AudioPlayer'

export function Grading() {
  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-xl mb-4">Hodnocení nahrávky</h1>
      <AudioPlayer />
    </div>
  )
}
