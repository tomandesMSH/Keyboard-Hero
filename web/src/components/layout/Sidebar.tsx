import { useLocation, useNavigate } from 'react-router-dom'
import { navItemsFor } from './navItems'

export function Sidebar({ role }: { role: 'student' | 'teacher' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const items = navItemsFor(role)
  const activeTab = new URLSearchParams(location.search).get('tab')

  return (
    <div className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r md:border-border md:p-5 md:gap-1">
      <div className="flex items-center gap-2.5 mb-6 px-1">
        <div className="w-8 h-8 rounded-lg bg-coral shadow-clay-sm flex items-center justify-center text-sm">🎵</div>
        <span className="font-heading font-bold text-base">Muzio</span>
      </div>
      {items.map((item) => {
        const active = item.isActive(location.pathname, activeTab)
        return (
          <button
            key={item.to}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-heading font-semibold text-left transition ${
              active ? 'bg-coral-tint text-coral-dark shadow-clay-sm' : 'text-text-muted hover:bg-bg-card-alt'
            }`}
            onClick={() => navigate(item.to)}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
