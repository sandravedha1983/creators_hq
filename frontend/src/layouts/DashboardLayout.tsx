import React, { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { motion } from "framer-motion"
import { useLocation } from "react-router-dom"
import { cn } from "@/utils/cn"
import { AiAssistant } from "@/components/ai/AiAssistant"

interface DashboardLayoutProps {
    children: React.ReactNode
}

const getBgImage = (pathname: string) => {
    const basePath = '/assets/backgrounds/';
    if (pathname.includes('dashboard')) return `${basePath}dashboard_bg.png`;
    if (pathname.includes('profile')) return `${basePath}profile_bg.png`;
    if (pathname.includes('billing')) return `${basePath}payment_bg.png`;
    if (pathname.includes('ai-studio')) return `${basePath}ai_bg.png`;
    if (pathname.includes('analytics')) return `${basePath}analytics_bg.png`;
    if (pathname.includes('integrations')) return `${basePath}integrations_bg.png`;
    if (pathname.includes('marketplace')) return `${basePath}marketplace_bg.png`;
    if (pathname.includes('settings')) return `${basePath}settings_bg.png`;
    return `${basePath}dashboard_bg.png`; 
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { pathname } = useLocation();
    const bgImage = getBgImage(pathname);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen text-heaven-text relative font-sans dashboard-layout overflow-x-hidden">
            {/* Signature Background Image - Full Resolution Restoration */}
            <div 
                key={bgImage}
                className="fixed inset-0 bg-cover bg-center pointer-events-none transition-all duration-[1000ms]"
                style={{ 
                    backgroundImage: `url(${bgImage})`,
                    zIndex: 0 
                }}
            />

            {/* Design System Overlay (60% Contrast Protection) */}
            <div className="fixed inset-0 bg-black/60 pointer-events-none" style={{ zIndex: 1 }} />

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
            <AiAssistant />
        </div>
    )
}
