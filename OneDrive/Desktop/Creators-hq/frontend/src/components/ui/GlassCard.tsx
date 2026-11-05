import React from 'react';
import { cn } from '@/utils/cn';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    hoverGlow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hoverGlow = true, ...props }) => {
    return (
        <motion.div
            whileHover={hoverGlow ? { y: -3 } : {}}
            className={cn(
                "relative group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500",
                className
            )}
            {...props}
        >
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
