import React, { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"
import { AiAssistant } from "@/components/ai/AiAssistant"

import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen text-heaven-text relative font-sans dashboard-layout overflow-x-hidden bg-dark">
            {/* Sidebar & Base Container */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className={cn(
                "flex flex-col min-h-screen relative transition-all duration-500",
                "pl-0 lg:pl-72"
            )} style={{ zIndex: 10 }}>
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-6 md:p-12 flex-1 relative bg-transparent"> 
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
            {user?.role === "creator" && <AiAssistant />}
        </div>
    )
}
