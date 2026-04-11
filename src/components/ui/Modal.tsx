import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/cn"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative bg-dark-navy border border-white/[0.08] rounded-[2.5rem] shadow-glass w-full max-w-lg overflow-hidden",
                            className
                        )}
                    >
                        <div className="flex items-center justify-between p-8 border-b border-white/[0.05]">
                            <h3 className="text-xl font-bold text-heaven-text uppercase tracking-tight">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-xl hover:bg-white/5 transition-colors text-heaven-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
