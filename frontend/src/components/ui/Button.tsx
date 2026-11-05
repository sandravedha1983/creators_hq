import * as React from "react"
import { cn } from "@/utils/cn"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neon' | 'glass'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-button-gradient text-white shadow-soft-glow hover:brightness-110 active:scale-95 transition-all duration-500',
            secondary: 'bg-primary-light text-white shadow-soft-glow hover:brightness-110 active:scale-95 transition-all duration-500',
            outline: 'border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-primary/20 hover:bg-white/[0.04] text-heaven-text active:scale-95 transition-all duration-500',
            ghost: 'bg-transparent hover:bg-white/[0.05] text-heaven-muted hover:text-heaven-text active:scale-95 transition-all duration-300',
            danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all duration-300',
            neon: 'bg-button-gradient text-white shadow-soft-glow hover:brightness-110 active:scale-95 transition-all duration-500 border-0',
            glass: 'bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-heaven-text hover:bg-white/[0.08] active:scale-95 transition-all duration-500'
        }

        const sizes = {
            sm: 'px-4 py-2 text-xs font-semibold tracking-wider uppercase',
            md: 'px-8 py-3.5 text-sm font-semibold tracking-wider uppercase',
            lg: 'px-10 py-4 text-base font-semibold tracking-widest uppercase',
            icon: 'p-3'
        }

        return (
            <button
                ref={ref}
                type={props.type || 'button'}
                disabled={isLoading || props.disabled}
                className={cn(
                    'inline-flex items-center justify-center rounded-[1.25rem] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse">Processing...</span>
                    </div>
                ) : children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
