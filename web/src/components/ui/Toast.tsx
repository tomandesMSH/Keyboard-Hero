interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed left-4 right-4 bottom-6 z-50 mx-auto max-w-sm rounded-xl bg-[#1D2023] text-text-primary px-4 py-3 text-sm font-semibold shadow-xl">
      {message}
    </div>
  )
}
