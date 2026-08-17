import React from 'react';
import { cn } from '@/utils/cn';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export function Logo({ className, size = 'md', showText = false }: LogoProps) {
    const sizeClasses = {
        sm: {
            container: 'w-8 h-8 rounded-lg',
            svg: 'w-4 h-4',
            text: 'text-sm tracking-wide'
        },
        md: {
            container: 'w-10 h-10 rounded-xl',
            svg: 'w-5 h-5',
            text: 'text-lg tracking-tight font-extrabold'
        },
        lg: {
            container: 'w-16 h-16 rounded-2xl',
            svg: 'w-8 h-8',
            text: 'text-2xl tracking-tighter font-black'
        },
        xl: {
            container: 'w-24 h-24 rounded-3xl',
            svg: 'w-12 h-12',
            text: 'text-4xl tracking-tighter font-black'
        }
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            {/* Elegant SVG Badge */}
            <div className={cn(
                "flex items-center justify-center bg-gradient-to-tr from-primary via-indigo-500 to-secondary p-[1.5px] shadow-soft-glow",
                currentSize.container
            )}>
                <div className="w-full h-full bg-[#050810]/95 rounded-[inherit] flex items-center justify-center">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cn("text-transparent bg-clip-text bg-gradient-to-tr from-primary to-secondary", currentSize.svg)}
                    >
                        <path
                            d="M12 2L2 7L12 12L22 7L12 2Z"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                        />
                        <path
                            d="M2 17L12 22L22 17"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-secondary"
                        />
                        <path
                            d="M2 12L12 17L22 12"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-indigo-400"
                        />
                    </svg>
                </div>
            </div>

            {/* Optional Typography */}
            {showText && (
                <span className={cn("font-bold uppercase tracking-widest text-heaven-text transition-all duration-300", currentSize.text)}>
                    Creators<span className="text-primary">HQ</span>
                </span>
            )}
        </div>
    );
}
