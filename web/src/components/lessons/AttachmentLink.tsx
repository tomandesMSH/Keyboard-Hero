import { useState } from 'react'
import { InfoTip } from '../ui/InfoTip'
import { fetchAttachmentDownloadUrl } from '../../lib/data/classrooms'
import { KEYBOARD_UTILS_DOWNLOAD_URL } from '../../lib/attachments'
import { getErrorMessage } from '../../lib/errors'
import type { Assignment } from '../../lib/data/types'

interface AttachmentLinkProps {
  assignment: Pick<Assignment, 'attachment_path' | 'attachment_name'>
  // The teacher sees a shorter explanation - they attached it themselves.
  forTeacher?: boolean
}

// The assignment's score, to download - with an "i" explaining what to do with it.
export function AttachmentLink({ assignment, forTeacher = false }: AttachmentLinkProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  if (!assignment.attachment_path) return null

  async function download() {
    setBusy(true)
    setError(undefined)
    try {
      // A signed link that downloads (Content-Disposition: attachment) - the
      // page stays where it is.
      window.location.assign(await fetchAttachmentDownloadUrl(assignment))
    } catch (err) {
      setError(getErrorMessage(err, 'Stažení se nepovedlo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold text-coral-dark hover:underline disabled:opacity-50 min-w-0"
          disabled={busy}
          onClick={download}
        >
          <span aria-hidden="true">🎼</span>
          <span className="truncate">{assignment.attachment_name ?? 'Noty ke stažení'}</span>
        </button>
        <InfoTip label="Co s tímhle souborem">
          {forTeacher ? (
            <span className="block">
              Noty, které jsi k úkolu přiložil(a). Žáci si je stáhnou a procvičí v aplikaci Keyboard Utils.
            </span>
          ) : (
            <>
              <span className="block mb-1.5">
                Učitel ti k úkolu přiložil noty skladby. Stáhni si soubor a otevři ho v aplikaci{' '}
                <b>Keyboard Utils</b> (zdarma pro Windows).
              </span>
              <span className="block mb-1.5">
                Uvidíš skladbu jako padající noty i v notách, můžeš si ji zpomalit, opakovat těžká místa a zkusit si ji
                zahrát v režimu učení - appka ti ukáže, co jsi trefil(a). Až ji budeš umět, nahraj úkol tady jako
                obvykle.
              </span>
              <a
                className="underline font-semibold"
                href={KEYBOARD_UTILS_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Stáhnout Keyboard Utils
              </a>
            </>
          )}
        </InfoTip>
      </div>
      {error && <p className="text-coral-dark mt-1">{error}</p>}
    </div>
  )
}
