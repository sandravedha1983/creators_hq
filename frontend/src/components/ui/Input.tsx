import * as React from "react"
import { cn } from "@/utils/cn"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-14 w-full rounded-2xl md:rounded-[1.5rem] border border-white/[0.08] bg-black/40 px-6 py-2 text-sm transition-all duration-500 placeholder:text-heaven-muted/40 focus:bg-black/60 focus:border-primary/30 outline-none disabled:cursor-not-allowed disabled:opacity-50 text-heaven-text",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
