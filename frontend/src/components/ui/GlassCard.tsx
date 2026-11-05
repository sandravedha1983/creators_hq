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
            whileHover={hoverGlow ? { y: -5, boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.2)' } : {}}
            className={cn(
                "relative group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500",
                className
            )}
            {...props}
        >
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
