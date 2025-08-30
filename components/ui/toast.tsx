import { X } from 'lucide-react'
import { Button } from './button'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
  const textColor = variant === 'destructive' ? 'text-red-800' : 'text-green-800'
  const iconColor = variant === 'destructive' ? 'text-red-600' : 'text-green-600'

  return (
    <div className={`p-4 border rounded-lg shadow-lg ${bgColor} max-w-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className={`font-medium ${textColor}`}>{title}</h4>
          {description && <p className={`text-sm mt-1 ${textColor} opacity-80`}>{description}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(id)}
          className={`h-6 w-6 p-0 ${iconColor} hover:bg-opacity-20`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
