import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    Zap,
    TrendingUp,
    ArrowUpRight,
    Download,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { getCreatorDashboard } from '@/services/dashboardService';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getCreatorDashboard();
                setStatsData(res.data);
            } catch (err) {
                console.error("Failed to load creator stats", err);
                toast.error("Critical: Neural Link Error. System Offline.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const isConnected = statsData?.instagram?.isConnected;

    if (loading) return <Spinner />;

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Dashboard</h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        System Synchronized
                    </div>
                </div>
                
                {isConnected && (
                    <div className="px-8 py-4 bg-green-500/10 border border-green-500/20 rounded-[2rem] backdrop-blur-xl flex items-center gap-6 shadow-lg shadow-green-500/5">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Instagram Connected ✅</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-black text-white">@{statsData.instagram.username}</p>
                                <a 
                                    href={statsData.instagram.profileLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-heaven-muted hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-10 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.05]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-glass">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-40">Connection Status</p>
                    <h3 className="text-3xl font-black text-heaven-text mt-3 tracking-tight">
                        {isConnected ? "Linked & Active" : "Disconnected"}
                    </h3>
                    {!isConnected && (
                        <Button 
                            variant="primary" 
                            onClick={() => window.location.href = '/integrations'}
                            className="mt-6 h-12 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest"
                        >
                            Connect Now
                        </Button>
                    )}
                </Card>

                <Card className="p-10 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.05]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary/10 text-secondary border border-secondary/20 shadow-glass">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-40">Growth Matrix</p>
                    <h3 className="text-3xl font-black text-heaven-text mt-3 tracking-tight">
                        {isConnected ? "Standby" : "No Data"}
                    </h3>
                    <p className="text-[9px] text-heaven-muted/40 font-bold mt-3 uppercase tracking-widest italic">Syncing historical nodes...</p>
                </Card>

                <Card className="p-10 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.05]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 text-accent border border-accent/20 shadow-glass">
                            <Zap className="w-8 h-8" />
                        </div>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-40">Platform Revenue</p>
                    <h3 className="text-3xl font-black text-heaven-text mt-3 tracking-tight">
                        ₹0.00
                    </h3>
                    <p className="text-[9px] text-heaven-muted/40 font-bold mt-3 uppercase tracking-widest italic">Pending brand verification</p>
                </Card>
            </div>

            {/* Main Insight Area */}
            <Card className="p-16 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#0A0F1D]/50 border-dashed border-white/10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />
                
                <div className="relative z-10 max-w-xl space-y-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-glass">
                        <TrendingUp className={cn("w-10 h-10", isConnected ? "text-primary animate-pulse" : "text-heaven-muted/20")} />
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Platform Pulse</h2>
                        <p className="text-sm text-heaven-muted font-medium leading-relaxed opacity-60">
                            {isConnected 
                                ? "System successfully linked to your Instagram identity. Data ingestion pipelines are warming up. Check back shortly for real-time analytics stream."
                                : "Insight modules are currently dormant. Establish a platform link in the App Directory to begin real-time data ingestion and neural analysis."
                            }
                        </p>
                    </div>

                    {!isConnected && (
                        <Button
                            onClick={() => window.location.href = '/integrations'}
                            variant="primary"
                            className="h-16 px-12 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-soft-glow"
                        >
                            Initialize Connection
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
