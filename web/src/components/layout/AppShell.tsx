import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  role: 'student' | 'teacher'
  children: ReactNode
}

// Mobile: content column with a bottom tab bar (phone-width, matches the
// design mockup). Desktop (md+): a persistent sidebar instead of the bottom
// bar, and the content column gets real breathing room instead of sitting
// in a phone-width strip in the middle of the screen.
export function AppShell({ role, children }: AppShellProps) {
  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-h-screen max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full mx-auto p-5 md:p-8">
        {children}
        <BottomNav role={role} />
      </div>
    </div>
  )
}
