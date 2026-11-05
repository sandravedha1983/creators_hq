import * as React from "react"
import { cn } from "@/utils/cn"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "bg-dark-navy rounded-[3.5rem] border border-white/[0.08] overflow-hidden group relative transition-all duration-300 shadow-premium",
            "hover:border-primary/40",
            className
        )}
        {...props}
    >
        <div className="relative z-10">
            {props.children}
        </div>
    </div>
))
Card.displayName = "Card"

export { Card }
