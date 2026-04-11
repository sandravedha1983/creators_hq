import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    Zap,
    FileText,
    TrendingUp,
    ArrowUpRight,
    Search,
    Bell,
    Layers,
    ChevronRight,
    MoreHorizontal,
    Download,
    Sparkles
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCreatorDashboard } from '@/services/dashboardService';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const { user } = useAuth();
    const { isAnyConnected } = useAppContext();
    const [activeTimeframe, setActiveTimeframe] = useState('6M');
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getCreatorDashboard();
                setStatsData(res.data);
            } catch (err) {
                console.error("Failed to load creator stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Map API stats to display stats
    const stats = statsData ? [
        { label: 'Active Collaborations', value: statsData.activeCollaborations.toString(), growth: '+12%', subtext: 'Running projects' },
        { label: 'Pending Requests', value: statsData.pendingRequests.toString(), growth: '+5%', subtext: 'Awaiting review' },
        { label: 'Total Earnings', value: `₹${(statsData.totalEarnings * 80).toLocaleString()}`, growth: '+24%', subtext: 'Lifetime revenue' },
        { label: 'Completed', value: statsData.completedCollaborations.toString(), growth: '+18%', subtext: 'Finished projects' }
    ] : [];

    const topContent: any[] = [];
    const recentLeads: any[] = [];

    const handleExport = () => {
        // Implementation for export
    };

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Dashboard</h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        System Ready
                    </div>
                </div>
            </div>

            {((isAnyConnected || statsData) && stats.length > 0) ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <Card key={i} className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-primary/10 text-primary border border-primary/20 shadow-glass")}>
                                        <Zap className="w-7 h-7" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black px-3 py-2 rounded-full bg-white/5 text-primary uppercase tracking-widest border border-primary/20 shadow-glass">
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                        {stat.growth}
                                    </div>
                                </div>
                                <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-40">{stat.label}</p>
                                <h3 className="text-4xl font-black text-heaven-text mt-3 tracking-tighter">{stat.value}</h3>
                                <p className="text-[10px] text-heaven-muted/60 font-bold mt-2 italic">{stat.subtext}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Chart Section */}
                        <Card className="lg:col-span-8 p-10 min-h-[450px] flex flex-col">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-bold text-heaven-text tracking-tight uppercase">Growth</h3>
                                    <button 
                                        onClick={handleExport}
                                        className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-heaven-muted hover:text-primary transition-all shadow-glass"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['7D', '30D', '90D', '6M', '1Y'].map(t => (
                                        <button 
                                            key={t} 
                                            onClick={() => setActiveTimeframe(t)}
                                            className={cn(
                                                "px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all", 
                                                t === activeTimeframe ? "bg-primary text-white shadow-soft-glow" : "text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04]"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative">
                                <div className="w-full h-full flex flex-col items-center justify-center text-heaven-text/20">
                                    <TrendingUp className="w-32 h-32 mb-6 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Data Stream...</p>
                                </div>
                            </div>
                        </Card>

                        {/* Side Panels */}
                        <div className="lg:col-span-4 space-y-10">
                            <Card className="p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-lg font-black text-heaven-text tracking-tight uppercase">Top Content</h3>
                                    <button className="text-heaven-muted hover:text-primary transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-8">
                                    {topContent.length === 0 && (
                                        <p className="text-[10px] text-heaven-muted uppercase tracking-[0.2em] text-center py-10 opacity-30 font-bold italic">
                                            Connect social accounts to see insights
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            ) : (
                <EmptyState 
                    title="Begin Your Journey"
                    description="Your dashboard is currently waiting for a data connection. Link your platforms to unlock the full potential of your digital empire."
                    icon={Sparkles}
                    actionLabel="Connect Platforms"
                    actionPath="/integrations"
                    className="py-32"
                />
            )}
        </div>
    );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border", className)}>
        {children}
    </span>
);
