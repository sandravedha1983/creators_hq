import { Search, Bell, User, Menu, Settings, Shield, ChevronDown, CheckCircle2, Zap } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/context/AuthContext"

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { user } = useAuth();
    
    return (
        <header className="h-24 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/[0.05]">
            <div className="flex items-center gap-6 flex-1">
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-heaven-muted hover:text-primary transition-all shadow-glass"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Search - Hidden on Small Mobile */}
                <div className="w-full max-w-md group relative hidden sm:block">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heaven-muted group-focus-within:text-primary transition-colors duration-300" />
                        <Input
                            placeholder="Universal search..."
                            className="pl-14 h-12 bg-black/20 border-white/5 focus:bg-black/40 focus:border-primary/20 text-white placeholder:text-heaven-muted text-xs rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-8">
                {/* System Activity */}
                <button className="p-3 rounded-xl text-heaven-muted hover:text-primary hover:bg-white/5 relative transition-all duration-300 group border border-transparent hover:border-primary/10">
                    <Bell className="w-5 h-5 relative z-10" />
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-soft-glow"></span>
                </button>

                <div className="h-8 w-[1px] bg-white/5 hidden sm:block"></div>

                {/* User Identity */}
                <div className="flex items-center gap-4 cursor-pointer group">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                            {user?.name || 'Vanguard'}
                        </p>
                        <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5 group-hover:opacity-100 opacity-60">
                            {user?.role || 'Creator'} Tier
                        </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-button-gradient rounded-xl flex items-center justify-center text-white font-bold text-base transition-all duration-300 group-hover:scale-105 shadow-soft-glow relative overflow-hidden">
                        <span className="relative z-10">{user?.name?.[0] || 'V'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
