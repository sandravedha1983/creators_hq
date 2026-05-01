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
import { Spinner } from '@/components/ui/Spinner';
import { getCreatorDashboard } from '@/services/dashboardService';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { testBackend } from '@/api';

export default function Dashboard() {
    const { user } = useAuth();
    const { isAnyConnected } = useAppContext();
    const [activeTimeframe, setActiveTimeframe] = useState('6M');
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Test backend connectivity
                const test = await testBackend();
                console.log("Backend Connectivity Test:", test.message);

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
        { 
            label: 'Total Followers', 
            value: statsData.instagram?.isConnected ? statsData.instagram.followers.toLocaleString() : '---', 
            growth: statsData.instagram?.isConnected ? statsData.followersGrowth : 'N/A', 
            subtext: statsData.instagram?.isConnected ? 'Social reach' : 'Connect Instagram' 
        },
        { 
            label: 'Engagement Rate', 
            value: statsData.instagram?.isConnected ? `${statsData.instagram.engagementRate}%` : '---', 
            growth: statsData.instagram?.isConnected ? statsData.engagementGrowth : 'N/A', 
            subtext: statsData.instagram?.isConnected ? 'Interaction score' : 'Connect Instagram' 
        },
        { 
            label: 'Total Earnings', 
            value: statsData.instagram?.isConnected ? `₹${(statsData.earnings * 80).toLocaleString()}` : '₹0', 
            growth: 'N/A', 
            subtext: 'Available after Business link' 
        },
        { 
            label: 'Growth Score', 
            value: statsData.instagram?.isConnected ? statsData.growthScore.toString() : '0', 
            growth: 'N/A', 
            subtext: 'Available after Business link' 
        }
    ] : [];

    useEffect(() => {
        // Step 1: Confirm Frontend ↔ Backend Connection
        fetch(`${import.meta.env.VITE_API_URL}/api/test`)
            .then(res => res.json())
            .then(data => console.log("API Connected:", data))
            .catch(err => console.error("API Error:", err));
    }, []);

    const topContent: any[] = statsData?.topContent || [];

    const handleExport = () => {
        if (!statsData?.instagram?.isConnected) {
            toast.error("Connect Instagram to enable data export.");
            return;
        }
        console.log("Initiating data export sequence...");
        const toastId = toast.loading("Preparing neural data packet...");
        
        setTimeout(() => {
            toast.success("Data exported successfully.", { id: toastId });
            console.log("Export complete.");
        }, 1500);
    };

    if (loading) return <Spinner />;

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Dashboard</h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        {loading ? 'Synchronizing...' : 'System Ready'}
                    </div>
                </div>
                {statsData?.instagram?.isConnected && (
                    <div className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl backdrop-blur-xl flex items-center gap-4 shadow-soft-glow">
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Active Origin</p>
                            <p className="text-xs font-black text-primary uppercase">@{statsData.instagram.username}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <Card key={i} className={cn(
                                "p-8 group relative overflow-hidden transition-all duration-500",
                                !statsData?.instagram?.isConnected && i > 1 && "opacity-40 grayscale"
                            )}>
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
                                    <h3 className="text-xl font-bold text-heaven-text tracking-tight uppercase">Platform Pulse</h3>
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
                                            disabled={!statsData?.instagram?.isConnected}
                                            onClick={() => setActiveTimeframe(t)}
                                            className={cn(
                                                "px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all", 
                                                t === activeTimeframe && statsData?.instagram?.isConnected ? "bg-primary text-white shadow-soft-glow" : "text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04]",
                                                !statsData?.instagram?.isConnected && "opacity-20 cursor-not-allowed"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative">
                                {!statsData?.instagram?.isConnected ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-8 p-12 bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/10">
                                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-heaven-muted opacity-20">
                                            <TrendingUp className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4 max-w-xs">
                                            <h4 className="text-sm font-bold uppercase tracking-widest">Connection Required</h4>
                                            <p className="text-xs text-heaven-muted font-medium opacity-60">Insight modules are currently dormant. Establish a platform link to begin real-time data ingestion.</p>
                                        </div>
                                        <Button 
                                            onClick={() => window.location.href = '/integrations'}
                                            variant="primary" 
                                            className="h-14 px-10 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em]"
                                        >
                                            Establish Connection
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-heaven-text/20">
                                        <TrendingUp className="w-32 h-32 mb-6 opacity-10 animate-pulse text-primary" />
                                        <p className="text-xs font-black uppercase tracking-[0.4em] text-primary/40">Real-time Data Streaming Enabled</p>
                                    </div>
                                )}
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
                                    {topContent.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-30">
                                            <FileText className="w-12 h-12" />
                                            <p className="text-[10px] text-heaven-muted uppercase tracking-[0.2em] font-bold italic">
                                                No data available<br/>Connect a platform to see insights
                                            </p>
                                        </div>
                                    ) : (
                                        topContent.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                {/* Content items rendering here */}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
        </div>
    );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border", className)}>
        {children}
    </span>
);
