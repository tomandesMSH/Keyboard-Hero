import { useLocation, useNavigate } from 'react-router-dom'
import { navItemsFor } from './navItems'

export function BottomNav({ role }: { role: 'student' | 'teacher' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const items = navItemsFor(role)
  const activeTab = new URLSearchParams(location.search).get('tab')

  return (
    <div className="mt-auto flex items-center justify-around border-t border-border pt-3 pb-4 md:hidden">
      {items.map((item) => {
        const active = item.isActive(location.pathname, activeTab)
        return (
          <button
            key={item.to}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${active ? 'text-coral' : 'text-text-muted'}`}
            onClick={() => navigate(item.to)}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
