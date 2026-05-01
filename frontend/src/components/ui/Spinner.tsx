import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className }: { className?: string }) => {
    return (
        <div className={`flex items-center justify-center w-full h-full min-h-[50vh] ${className || ''}`}>
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    );
};
