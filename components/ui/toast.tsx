import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toastVariants = cva(
  "fixed bottom-4 right-4 w-80 rounded-md border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 text-gray-900",
        success: "bg-green-100 border-green-300 text-green-800",
        destructive: "bg-red-100 border-red-300 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string
  description?: string
}

export function Toast({ title, description, variant, className, ...props }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)} {...props}>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  )
}
