import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Rocket } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    actionPath?: string;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon = Rocket,
    actionLabel,
    actionPath,
    className
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "flex flex-col items-center justify-center p-16 text-center bg-dark-navy border border-white/[0.08] rounded-[4rem] relative overflow-hidden group shadow-premium",
                "hover:border-primary/40 hover:shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-all duration-700",
                className
            )}
        >
            {/* Neon Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent group-hover:h-1.5 transition-all duration-700 opacity-30 group-hover:opacity-100" />

            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-12 relative group-hover:rotate-6 transition-all duration-700">
                <Icon className="w-10 h-10 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight mb-6 uppercase tracking-tight">{title}</h3>
            <p className="text-heaven-muted text-[11px] font-bold uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed opacity-40">
                {description}
            </p>
            {actionLabel && actionPath && (
                <Link to={actionPath}>
                    <Button variant="primary" size="lg" className="shadow-soft-glow">
                        {actionLabel}
                    </Button>
                </Link>
            )}
        </motion.div>
    );
};
