export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-xl mb-2">{title}</h1>
      <p className="text-text-muted text-sm">Tato obrazovka zatím čeká na implementaci.</p>
    </div>
  )
}
