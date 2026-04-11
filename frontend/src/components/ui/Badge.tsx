import * as React from "react"
import { cn } from "@/utils/cn"

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'hot' | 'warm' | 'cold' | 'default' | 'outline' | 'success' | 'warning'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-gray-100 text-gray-700',
            outline: 'border border-gray-200 text-gray-600',
            hot: 'bg-red-50 text-red-600 border border-red-100',
            warm: 'bg-orange-50 text-orange-600 border border-orange-100',
            cold: 'bg-blue-50 text-blue-600 border border-blue-100',
            success: 'bg-green-50 text-green-600 border border-green-100',
            warning: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
