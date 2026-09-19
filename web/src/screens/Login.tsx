import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../lib/AuthProvider'
import { signIn, signUpStudent, signUpTeacher } from '../lib/auth'
import { applyTheme, getStoredTheme } from '../lib/theme'
import { needsGuardianConsent } from '../lib/consent'
import { getErrorMessage } from '../lib/errors'

type Mode = 'login' | 'register' | 'forgot'
type Portal = 'student' | 'teacher'

export function Login() {
  const navigate = useNavigate()
  const { session, profile, loading: authLoading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [portal, setPortal] = useState<Portal>('student')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === 'dark')

  const isMinor = dateOfBirth ? needsGuardianConsent(dateOfBirth) : false
  const isStudentRegistration = mode === 'register' && portal === 'student'

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next ? 'dark' : 'light')
  }

  useEffect(() => {
    if (!authLoading && session && profile) {
      const home =
        profile.role === 'teacher' ? '/teacher' : profile.role === 'moderator' ? '/moderator' : '/student'
      navigate(home, { replace: true })
    }
  }, [authLoading, session, profile, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(username, password)
        // AuthProvider picks up the new session and the effect above redirects.
      } else if (portal === 'teacher') {
        await signUpTeacher(username, fullName, password)
      } else {
        await signUpStudent(username, fullName, password, {
          dateOfBirth,
          guardianName: isMinor ? guardianName : undefined,
        })
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Něco se nepovedlo, zkus to prosím znovu.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto p-6 pt-16 relative">
      <button
        type="button"
        aria-label={darkMode ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
        className="absolute right-6 top-6 w-9 h-9 rounded-full bg-bg-card shadow-clay-sm flex items-center justify-center text-base"
        onClick={toggleDarkMode}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      <h1 className="text-2xl font-heading font-bold mb-1">Muzio</h1>
      <p className="text-text-muted text-sm mb-8">Uč se hudbu hravě, každý den.</p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          className={`flex-1 py-2.5 rounded-full text-xs font-heading font-semibold transition ${
            mode !== 'register' ? 'bg-ink text-cream shadow-clay-sm' : 'bg-bg-card-alt text-text-muted shadow-clay-press'
          }`}
          onClick={() => setMode('login')}
        >
          Přihlásit se
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 rounded-full text-xs font-heading font-semibold transition ${
            mode === 'register' ? 'bg-ink text-cream shadow-clay-sm' : 'bg-bg-card-alt text-text-muted shadow-clay-press'
          }`}
          onClick={() => setMode('register')}
        >
          Registrace
        </button>
      </div>

      {mode === 'register' && (
        <div className="flex gap-2.5 mb-6">
          <button
            type="button"
            className={`flex-1 text-center py-3 px-2 rounded-2xl text-xs font-heading font-semibold transition ${
              portal === 'student' ? 'bg-coral-tint text-coral-dark shadow-clay-sm' : 'text-text-muted shadow-clay-press'
            }`}
            onClick={() => setPortal('student')}
          >
            Jsem žák
          </button>
          <button
            type="button"
            className={`flex-1 text-center py-3 px-2 rounded-2xl text-xs font-heading font-semibold transition ${
              portal === 'teacher' ? 'bg-coral-tint text-coral-dark shadow-clay-sm' : 'text-text-muted shadow-clay-press'
            }`}
            onClick={() => setPortal('teacher')}
          >
            Jsem učitel
          </button>
        </div>
      )}

      {mode === 'forgot' ? (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg">Zapomněli jste heslo?</h2>
          <p className="text-sm text-text-muted">
            Muzio nepracuje s e-maily, takže si heslo nemůžeš obnovit sám. Nové ti nastaví někdo, kdo tě zná:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="rounded-2xl bg-bg-card shadow-clay-sm p-3.5">
              <span className="font-heading font-semibold">Žák</span> - požádej svého učitele. Ve své sekci Žáci ti
              nastaví nové heslo.
            </li>
            <li className="rounded-2xl bg-bg-card shadow-clay-sm p-3.5">
              <span className="font-heading font-semibold">Učitel</span> - požádej správce appky (moderátora), který ti
              heslo nastaví.
            </li>
          </ul>
          <p className="text-xs text-text-muted">
            Pověz jim své uživatelské jméno. Nové heslo ti předají osobně a po přihlášení už s ním můžeš normálně
            pracovat.
          </p>
          <Button type="button" className="w-full" onClick={() => setMode('login')}>
            Zpět na přihlášení
          </Button>
        </div>
      ) : (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Uživatelské jméno</div>
          <Input
            placeholder="napr. tomask"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        {mode === 'register' && (
          <div>
            <div className="text-xs font-semibold text-text-muted mb-1.5">Celé jméno</div>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        )}
        {isStudentRegistration && (
          <div>
            <div className="text-xs font-semibold text-text-muted mb-1.5">Datum narození</div>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Heslo</div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </div>
        {mode === 'login' && (
          <div className="text-right -mt-2">
            <button
              type="button"
              className="text-xs text-text-muted underline underline-offset-2 hover:text-text-primary"
              onClick={() => {
                setError(undefined)
                setMode('forgot')
              }}
            >
              Zapomněli jste heslo?
            </button>
          </div>
        )}
        {isStudentRegistration && dateOfBirth && isMinor && (
          <div>
            <div className="text-xs font-semibold text-text-muted mb-1.5">Jméno zákonného zástupce</div>
            <Input
              placeholder="Jméno rodiče/opatrovníka"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
            />
          </div>
        )}
        {isStudentRegistration && dateOfBirth && (
          <label className="flex items-start gap-2.5 text-xs text-text-muted">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              required
            />
            <span>
              {isMinor
                ? 'Jako zákonný zástupce potvrzuji souhlas se zpracováním osobních údajů dítěte (jméno, audio nahrávky, pokrok) v appce Muzio.'
                : 'Souhlasím se zpracováním svých osobních údajů (jméno, audio nahrávky, pokrok) v appce Muzio.'}
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-coral-dark">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {mode === 'login' ? 'Přihlásit se' : 'Zaregistrovat se'}
        </Button>
      </form>
      )}

      {mode === 'register' && portal === 'teacher' && (
        <p className="text-text-muted text-xs mt-4 text-center">
          Nový učitelský účet čeká na ruční ověření identity, než bude moci párovat žáky.
        </p>
      )}

      <div className="fixed right-4 bottom-4 flex items-center gap-2">
        <a
          href="https://www.zusmk.cz/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-white rounded-lg shadow-clay-sm opacity-90 hover:opacity-100 transition flex items-center justify-center"
          aria-label="ZUŠ Moravský Krumlov"
        >
          <img src="/zus-mk-logo.png" alt="ZUŠ Moravský Krumlov" className="h-11 w-11 object-contain" />
        </a>
        <a
          href="https://github.com/tomandesMSH/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-white rounded-lg shadow-clay-sm opacity-90 hover:opacity-100 transition flex items-center justify-center"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 16 16" className="h-8 w-8" fill="#181717" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
      </div>
    </div>
  )
}
