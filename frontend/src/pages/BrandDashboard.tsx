import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Megaphone, Users, BarChart3, ArrowUpRight, Plus, Search, Filter, Star, Zap, Shield, Rocket, Target, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/utils/cn';
import { getBrandDashboard } from '@/services/dashboardService';
import { toast } from 'react-hot-toast';


export default function BrandDashboard() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'creators'>('campaigns');
    const navigate = useNavigate();
    const { campaigns, users } = useAppContext();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getBrandDashboard();
                setStatsData(res.data);
            } catch (err) {
                console.error("Failed to load brand stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const myCampaigns = campaigns.filter(c => c.brandId === 'system' || c.brandId === 'admin@creatorshq.ai');
    const creatorCount = users.filter(u => u.role === 'creator').length;
    // Fallback to local calculation if API fails or is empty, but prioritize API
    const totalBudget = statsData?.totalBudget || myCampaigns.reduce((acc, c) => acc + parseInt(c.budget.replace(/[^0-9]/g, '') || '0'), 0);

    return (
        <div className="space-y-16 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase cursor-default leading-none">Brand Compass</h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <Target className="w-4 h-4 text-primary animate-pulse" />
                        Campaign Ecosystem Standby
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => navigate('/analytics')}
                        variant="secondary"
                        className="h-16 px-10 rounded-[2.25rem] font-bold text-[10px] uppercase tracking-[0.3em] bg-white/[0.04] border-white/10 text-heaven-muted hover:text-heaven-text shadow-glass"
                    >
                        Growth Insights
                    </Button>
                    <Button
                        onClick={() => navigate('/campaigns')}
                        variant="primary"
                        className="h-16 px-10 rounded-[2.25rem] gap-4 font-bold text-[10px] uppercase tracking-[0.3em] shadow-soft-glow hover:scale-[1.02] transition-all"
                    >
                        <Plus className="w-5 h-5 shadow-sm" />
                        Launch Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                    { label: 'Active Projects', value: (statsData?.activeCampaigns ?? myCampaigns.length).toString(), icon: Megaphone, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'Connected Talent', value: (statsData?.totalCreators ?? creatorCount).toString(), icon: Users, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
                    { label: 'Strategic Budget', value: `₹${((statsData?.totalBudget || totalBudget) * 80 || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
                    { label: 'Total Campaigns', value: (statsData?.totalCampaigns ?? 0).toString(), icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                ].map((stat, i) => (
                    <Card key={i} className="p-10 group hover:scale-[1.02] transition-all duration-700 border-white/[0.08] bg-[#050810]/30 backdrop-blur-3xl rounded-[3.5rem] shadow-glass overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors duration-1000" />
                        <div className="flex flex-col gap-8 relative z-10">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 border shadow-glass", stat.bg, stat.color)}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">{stat.label}</p>
                                <h3 className="text-4xl font-bold text-heaven-text tracking-tighter leading-none">{stat.value}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-12">
                <div className="flex items-center gap-14 border-b border-white/[0.05]">
                    {[
                        { id: 'campaigns', label: 'Live Campaigns' },
                        { id: 'creators', label: 'Talent Directory' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "pb-6 text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative",
                                activeTab === tab.id ? 'text-primary' : 'text-heaven-muted hover:text-heaven-text'
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="tab-active-brand" className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-soft-glow rounded-full" />}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'campaigns' ? (
                        <motion.div
                            key="campaigns"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Card className="p-24 bg-[#050810]/30 border border-dashed border-white/[0.08] rounded-[5rem] flex flex-col items-center text-center space-y-12 backdrop-blur-3xl shadow-glass">
                                <div className="w-28 h-28 bg-white/[0.04] rounded-[3.5rem] flex items-center justify-center text-heaven-muted/10 border border-white/[0.08] shadow-glass relative group">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Megaphone className="w-14 h-14 relative z-10" />
                                </div>
                                <div className="max-w-md space-y-6">
                                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase leading-none">Campaign Activity: Dormant</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] leading-loose opacity-40">
                                        Your brand portfolio is currently awaiting deployment. Initiate a new project brief to start engaging with the global talent landscape.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/campaigns')}
                                    className="h-20 px-16 rounded-[2.5rem] font-bold text-[11px] uppercase tracking-[0.5em] shadow-soft-glow hover:scale-[1.02] transition-all"
                                >
                                    Initiate First Campaign
                                </Button>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="creators"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-12"
                        >
                            <div className="flex flex-col lg:flex-row gap-8">
                                <Card className="flex-1 p-4 bg-black/40 border border-white/[0.08] rounded-[2.5rem] flex items-center gap-8 group focus-within:border-primary/20 transition-all shadow-glass">
                                    <Search className="w-6 h-6 text-heaven-muted ml-8 group-focus-within:text-primary transition-colors opacity-40" />
                                    <Input placeholder="Search discovery engine for top-tier creators..." className="border-0 bg-transparent shadow-none h-16 px-0 focus-visible:ring-0 flex-1 text-heaven-text font-bold text-[11px] uppercase tracking-widest placeholder:text-heaven-muted/20" />
                                </Card>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => {
                                        toast.success("Strategic filters activated.");
                                        console.log("Filtering engine engaged...");
                                    }}
                                    className="h-20 px-14 rounded-[2.5rem] bg-white/[0.02] border border-white/10 text-heaven-muted font-bold text-[11px] uppercase tracking-[0.3em] shadow-glass hover:text-heaven-text"
                                >
                                    <Filter className="w-5 h-5 mr-4 text-primary" />
                                    Strategic Filters
                                </Button>
                            </div>

                            <Card className="p-24 bg-[#050810]/30 border border-dashed border-white/[0.08] rounded-[5rem] flex flex-col items-center text-center space-y-12 backdrop-blur-3xl shadow-glass">
                                <div className="w-28 h-28 bg-white/[0.04] rounded-[3.5rem] flex items-center justify-center text-heaven-muted/10 border border-white/[0.08] shadow-glass relative group">
                                    <div className="absolute inset-0 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Star className="w-14 h-14 relative z-10" />
                                </div>
                                <div className="max-w-md space-y-6">
                                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase leading-none">Global Talent Discovery</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] leading-loose opacity-40">
                                        Access elite talent across every vertical. Use our advanced discovery engine to identify ambassadors that resonate with your brand identity.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/creators')}
                                    className="h-20 px-16 rounded-[2.5rem] font-bold text-[11px] uppercase tracking-[0.5em] shadow-soft-glow hover:scale-[1.02] transition-all"
                                >
                                    Browse Directory Hub
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
