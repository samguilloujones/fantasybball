"use client"

import { useState } from "react"
import { Toast } from "@/components/ui/toast"

let listeners: ((toasts: any[]) => void)[] = []
let toasts: any[] = []

export function useToast() {
  const [state, setState] = useState(toasts)

  function update(newToasts: any[]) {
    toasts = newToasts
    setState(toasts)
    listeners.forEach((l) => l(toasts))
  }

  function toast({ title, description, variant }: { title: string; description?: string; variant?: string }) {
    const id = Date.now()
    const newToast = { id, title, description, variant }
    update([...toasts, newToast])
    setTimeout(() => {
      update(toasts.filter((t) => t.id !== id))
    }, 3000)
  }

  return { toast, toasts: state }
}

export function Toaster() {
  const [state, setState] = useState(toasts)
  listeners = [setState]

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {state.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  )
}
