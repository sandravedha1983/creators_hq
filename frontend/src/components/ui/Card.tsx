import * as React from "react"
import { cn } from "@/utils/cn"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "bg-dark-navy rounded-[3.5rem] border border-white/[0.05] overflow-hidden group relative transition-all duration-700 shadow-premium",
            "hover:border-primary/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
            className
        )}
        {...props}
    >
        {/* Neon Perimeter Glow - System Ready */}
        <div className="absolute inset-0 border border-transparent group-hover:border-primary/20 rounded-[3.5rem] transition-colors duration-700 pointer-events-none" />
        
        {/* Subtle Glass Shine Gradient */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 opacity-0 group-hover:opacity-100 transition-all duration-700" />
        
        <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700" />
        <div className="relative z-10">
            {props.children}
        </div>
    </div>
))
Card.displayName = "Card"

export { Card }
