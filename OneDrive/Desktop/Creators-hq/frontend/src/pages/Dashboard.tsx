import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    Zap,
    TrendingUp,
    ExternalLink,
    CheckCircle2,
    Star,
    Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { getCreatorDashboard } from '@/services/dashboardService';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { MEMBERSHIP_UI_ENABLED } from '@/config/planVisibility';

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
                toast.error("Dashboard connection sync in progress...");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const isConnected = statsData?.instagram?.isConnected;
    const growthScore = statsData?.growthScore || 0;
    const followers = statsData?.followers || 0;
    const engagement = statsData?.engagement || 0;
    const earnings = statsData?.earnings || 0;

    if (loading) return <Spinner />;

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                        {user?.name ? `${user.name}'s Dashboard` : 'Creator Dashboard'}
                    </h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-soft-glow" />
                        Supabase PostgreSQL Synced
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
                                <p className="text-sm font-black text-white">@{statsData?.instagram?.username}</p>
                                {statsData?.instagram?.profileLink && (
                                    <a
                                        href={statsData.instagram.profileLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-heaven-muted hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Growth Score */}
                <Card className="p-8 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.08] hover:border-primary/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-glass">
                            <Star className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                            Rating
                        </span>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-50">Growth Score</p>
                    <h3 className="text-4xl font-black text-heaven-text mt-2 tracking-tight">
                        {growthScore > 0 ? `${growthScore}/100` : 'Calibrating'}
                    </h3>
                    <p className="text-[9px] text-heaven-muted/50 font-bold mt-2 uppercase tracking-widest">
                        {growthScore >= 80 ? 'High performance' : 'Profile completeness driven'}
                    </p>
                </Card>

                {/* Audience / Followers */}
                <Card className="p-8 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.08] hover:border-primary/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary/10 text-secondary border border-secondary/20 shadow-glass">
                            <Users className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
                            Reach
                        </span>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-50">Audience Network</p>
                    <h3 className="text-4xl font-black text-heaven-text mt-2 tracking-tight">
                        {followers > 0 ? followers.toLocaleString() : '—'}
                    </h3>
                    <p className="text-[9px] text-heaven-muted/50 font-bold mt-2 uppercase tracking-widest">
                        {followers > 0 ? 'Verified network followers' : 'Connect socials to sync'}
                    </p>
                </Card>

                {/* Engagement Rate */}
                <Card className="p-8 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.08] hover:border-primary/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-glass">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            Interaction
                        </span>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-50">Engagement Rate</p>
                    <h3 className="text-4xl font-black text-heaven-text mt-2 tracking-tight">
                        {engagement > 0 ? `${engagement}%` : '—'}
                    </h3>
                    <p className="text-[9px] text-heaven-muted/50 font-bold mt-2 uppercase tracking-widest">
                        {engagement > 0 ? 'Audience response ratio' : 'Syncing interaction pulse'}
                    </p>
                </Card>

                {/* Platform Revenue */}
                <Card className="p-8 group relative overflow-hidden transition-all duration-500 bg-[#0A0F1D] border-white/[0.08] hover:border-primary/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent border border-accent/20 shadow-glass">
                            <Zap className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                            Ledger
                        </span>
                    </div>
                    <p className="text-[10px] text-heaven-muted font-black uppercase tracking-[0.2em] opacity-50">Recorded Earnings</p>
                    <h3 className="text-4xl font-black text-heaven-text mt-2 tracking-tight">
                        ₹{Number(earnings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[9px] text-heaven-muted/50 font-bold mt-2 uppercase tracking-widest">
                        Settled campaign payouts
                    </p>
                </Card>
            </div>

            {/* Main Insight & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="p-12 lg:col-span-2 rounded-[3.5rem] flex flex-col justify-between relative overflow-hidden bg-[#0A0F1D]/80 border-white/[0.08]">
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-primary">Algorithm Diagnostics</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Platform Pulse & Recommendation</h2>
                        <p className="text-sm text-heaven-muted font-medium leading-relaxed max-w-xl">
                            {growthScore < 50
                                ? "Complete your profile bio, niche categories, and portfolio items to elevate your Growth Score. Creators with score 70+ receive 4.5x more brand sponsorship inquiries."
                                : "Your creator profile is performing in the upper tier! Leverage AI Studio to generate compelling pitch templates and apply directly to open Brand Campaigns."
                            }
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-8 relative z-10">
                        <Button
                            onClick={() => window.location.href = '/ai-studio'}
                            variant="primary"
                            className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-soft-glow"
                        >
                            Open AI Studio
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/marketplace'}
                            variant="secondary"
                            className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/10"
                        >
                            Browse Campaigns
                        </Button>
                    </div>
                </Card>

                <Card className="p-10 rounded-[3.5rem] bg-[#0A0F1D]/80 border-white/[0.08] flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-heaven-text uppercase mb-4">Verification State</h3>
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-heaven-muted font-medium">Status:</span>
                                <span className="font-bold text-primary uppercase">
                                    {user?.verificationStatus || 'Active'}
                                </span>
                            </div>
                            {MEMBERSHIP_UI_ENABLED && <div className="flex justify-between items-center text-xs">
                                <span className="text-heaven-muted font-medium">Plan Tier:</span>
                                <span className="font-bold text-emerald-400 uppercase">
                                    {user?.plan === 'pro' ? 'Radiance Pro' : 'Beta Free Tier'}
                                </span>
                            </div>}
                        </div>
                    </div>

                    <Button
                        onClick={() => window.location.href = '/profile'}
                        variant="secondary"
                        className="w-full h-14 rounded-2xl font-bold uppercase tracking-wider text-[10px] border-white/10 mt-6"
                    >
                        Edit Public Profile
                    </Button>
                </Card>
            </div>
        </div>
    );
}
