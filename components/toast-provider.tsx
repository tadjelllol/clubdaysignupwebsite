'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Toast } from '@/components/ui/toast'

interface ToastContextType {
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, toasts, dismiss } = useToast()

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

