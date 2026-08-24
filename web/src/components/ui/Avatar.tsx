interface AvatarProps {
  name: string
  src?: string
  online?: boolean
  size?: number
}

export function Avatar({ name, src, online, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-periwinkle to-magenta flex items-center justify-center text-text-primary font-heading font-semibold text-sm">
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bg ${online ? 'bg-coral' : 'bg-text-muted'}`}
        />
      )}
    </div>
  )
}
