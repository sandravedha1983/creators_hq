import React, { useState } from "react"
import logo from "@/assets/OIP (1).webp"
import {
    LayoutDashboard,
    Users,
    FileText,
    ShoppingBag,
    BarChart3,
    Zap,
    CreditCard,
    Settings,
    LogOut,
    Layers,
    User,
    Megaphone,
    Shield,
    Database,
    FileSearch,
    Sparkles,
    MessageSquare,
    Activity as ActivityIcon,
    Bell,
    UserPlus,
    X,
    Search,
    Menu,
    ChevronDown,
    CheckCircle2
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth, UserRole } from "@/context/AuthContext"
import { useAppContext } from "@/context/AppContext"
import { cn } from "@/utils/cn"

const menuConfigs: Record<UserRole, { icon: any, label: string, path: string }[]> = {
    creator: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/creator-dashboard" },
        { icon: Users, label: "CRM", path: "/crm" },
        { icon: FileText, label: "Content", path: "/content" },
        { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
        { icon: Layers, label: "Integrations", path: "/integrations" },
        { icon: Bell, label: "Activity", path: "/notifications" },
        { icon: BarChart3, label: "Analytics", path: "/analytics" },
        { icon: Zap, label: "Automation", path: "/automation" },
        { icon: CreditCard, label: "Billing", path: "/billing" },
        { icon: Sparkles, label: "AI Studio", path: "/ai-studio" },
        { icon: MessageSquare, label: "Messages", path: "/messages" },
    ],
    brand: [
        { icon: LayoutDashboard, label: "Brand Overview", path: "/brand-dashboard" },
        { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
        { icon: Users, label: "Creators", path: "/creators" },
        { icon: Layers, label: "Integrations", path: "/integrations" },
        { icon: UserPlus, label: "Team", path: "/team" },
        { icon: Bell, label: "Activity", path: "/notifications" },
        { icon: BarChart3, label: "Campaign Data", path: "/analytics" },
        { icon: MessageSquare, label: "Messages", path: "/messages" },
    ],
    admin: [
        { icon: LayoutDashboard, label: "Admin View", path: "/admin-dashboard" },
        { icon: Database, label: "Users", path: "/users" },
        { icon: FileSearch, label: "Reports", path: "/reports" },
        { icon: Bell, label: "Activity", path: "/notifications" },
        { icon: MessageSquare, label: "Messages", path: "/messages" },
    ]
}

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    return (
        <nav className="h-24 px-6 md:px-12 flex items-center justify-between border-b border-white/[0.05] bg-dark/40 backdrop-blur-xl relative z-30">
            <div className="flex items-center gap-6">
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-heaven-muted hover:text-primary transition-all shadow-glass"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="relative group flex-1 max-w-md hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heaven-muted" />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-heaven-muted focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>
        </nav>
    )
}

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (val: boolean) => void }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { logout, user } = useAuth()
    const { activities } = useAppContext()
    const role = user?.role || 'creator'
    const menuItems = menuConfigs[role]
    const unreadCount = activities.filter(a => !a.read).length

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className={cn(
            "w-72 h-screen flex flex-col fixed left-0 top-0 z-50 bg-[#0B0F1A] border-r border-white/5 transition-transform duration-500",
            isOpen ? "translate-x-0 shadow-2xl shadow-primary/20" : "-translate-x-full lg:translate-x-0"
        )}>
            <div className="p-8 pb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-soft-glow relative group">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover relative z-10" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-white uppercase">
                            CreatorsHQ
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen?.(false)}
                    className="lg:hidden p-2 text-heaven-muted hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const hasNotifications = item.path === '/notifications' && unreadCount > 0;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group font-bold text-sm tracking-wide relative",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-soft-glow"
                                    : "text-heaven-muted hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-colors duration-300", isActive ? "text-primary shadow-soft-glow" : "text-heaven-muted group-hover:text-white")} />
                            <span>{item.label}</span>
                            
                            {hasNotifications && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-4 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-soft-glow"
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-8 space-y-2 border-t border-white/5 bg-[#111827]">
                <Link
                    to="/profile"
                    className={cn(
                        "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide",
                        location.pathname === "/profile"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-heaven-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <User className="w-5 h-5 transition-colors duration-300" />
                    <span>Profile Settings</span>
                </Link>
                
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-heaven-muted hover:text-rose-500 hover:bg-rose-500/10 font-bold text-sm tracking-wide group"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span>Sign Out</span>
                </button>

                <div className="pt-2">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0B0F1A] border border-white/5 shadow-2xl transition-all duration-300">
                        <ActivityIcon className="w-3 h-3 text-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-heaven-muted tracking-widest uppercase italic">
                            {unreadCount > 0 ? `${unreadCount} System Events` : 'System Standby'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
