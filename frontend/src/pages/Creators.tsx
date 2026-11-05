import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Users, Star, ArrowUpRight, ShieldCheck, MapPin, Target, Send, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { getPublicCreators } from '@/services/profileService';

interface PublicCreator {
    _id: string;
    user_id: { _id: string; name: string; email: string; avatar?: string; verificationStatus?: string; socials?: any };
    username?: string;
    niche: string;
    location: string;
    followers: number;
    growthScore: number;
    bio: string;
    socialLinks?: Record<string, string>;
}

const NICHES = ['All', 'Technology', 'Lifestyle', 'Fashion', 'Health', 'Food', 'Travel', 'Gaming', 'Finance', 'Education'];

export default function Creators() {
    const [creators, setCreators] = useState<PublicCreator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('All');
    const [requested, setRequested] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPublicCreators({
                search: searchQuery || undefined,
                niche: selectedNiche !== 'All' ? selectedNiche : undefined,
                page
            });
            setCreators(res.data || []);
            setTotal(res.total || 0);
        } catch (err) {
            console.error('[Creators] Load failed', err);
            setCreators([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedNiche, page]);

    useEffect(() => { load(); }, [load]);

    // Debounce search
    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedNiche]);

    const handleSendRequest = (id: string, name: string) => {
        if (requested.includes(id)) return;
        toast.promise(
            new Promise(resolve => setTimeout(() => { setRequested(prev => [...prev, id]); resolve(true); }, 800)),
            { loading: `Sending proposal to ${name}...`, success: `Proposal sent to ${name}`, error: 'Failed to send.' }
        );
    };

    const formatFollowers = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return n.toString();
    };

    return (
        <div className="space-y-16 animate-fade-in pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase cursor-default">Talent Discovery</h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <Users className="w-4 h-4 text-primary animate-pulse" />
                        {total > 0 ? `${total} creators in the network` : 'Accessing Global Creator Network'}
                    </p>
                </div>
                <Button onClick={load} variant="secondary" className="h-14 px-8 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest bg-white/[0.04] border-white/[0.08]">
                    <RefreshCw className="w-4 h-4 mr-3" /> Refresh
                </Button>
            </div>

            {/* Search & filters */}
            <div className="flex flex-col lg:flex-row gap-8">
                <Card className="flex-1 p-3 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] flex items-center gap-6 focus-within:border-primary/20 transition-all shadow-glass">
                    <Search className="w-5 h-5 text-heaven-muted/40 ml-6" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name, handle or niche..."
                        className="border-0 bg-transparent shadow-none h-14 px-0 focus-visible:ring-0 flex-1 text-heaven-text font-bold text-[11px] placeholder:text-heaven-muted/10"
                    />
                </Card>
                <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 no-scrollbar items-center flex-wrap">
                    {NICHES.map(niche => (
                        <Button
                            key={niche}
                            onClick={() => setSelectedNiche(niche)}
                            className={cn(
                                'h-12 px-8 rounded-2xl transition-all whitespace-nowrap text-[10px] font-bold uppercase tracking-widest border shadow-glass',
                                selectedNiche === niche
                                    ? 'bg-primary text-white border-primary/20 shadow-soft-glow'
                                    : 'bg-white/[0.04] text-heaven-muted border-white/[0.08] hover:bg-white/[0.08] hover:text-heaven-text'
                            )}
                        >{niche}</Button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center h-52">
                    <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : creators.length === 0 ? (
                <Card className="py-40 border-2 border-dashed border-white/[0.08] rounded-[6rem] bg-white/[0.02] flex flex-col items-center text-center backdrop-blur-xl">
                    <div className="w-24 h-24 bg-white/[0.04] rounded-[3.5rem] shadow-glass border border-white/[0.08] flex items-center justify-center text-heaven-muted/10 mb-10 opacity-20">
                        <Search className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase">No Creators Found</h3>
                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] max-w-sm mx-auto leading-loose opacity-40 mt-4">
                        {searchQuery || selectedNiche !== 'All'
                            ? 'Try a different search or niche filter.'
                            : 'Be the first creator to complete your profile and appear here!'}
                    </p>
                    <Button onClick={() => { setSearchQuery(''); setSelectedNiche('All'); }} variant="primary" className="h-16 px-16 text-[11px] font-bold uppercase tracking-widest rounded-[2.5rem] mt-12 shadow-soft-glow">
                        Reset Filters
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {creators.map((creator, i) => {
                        const user = creator.user_id;
                        const displayName = user?.name || creator.username || 'Creator';
                        const isVerified = user?.verificationStatus === 'verified';
                        const hasRequested = requested.includes(creator._id);

                        return (
                            <motion.div
                                key={creator._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Card className={cn(
                                    'p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl rounded-[4rem] hover:scale-[1.02] transition-all duration-700 flex flex-col gap-8 relative group overflow-hidden shadow-glass',
                                    hasRequested && 'border-primary/10'
                                )}>
                                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />

                                    {/* Avatar + verified badge */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shadow-glass transition-transform group-hover:rotate-3">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-primary">{displayName[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        {isVerified && (
                                            <div className="p-3 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl shadow-glass">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                        )}
                                        {creator.growthScore > 0 && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                                                <Star className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-bold text-primary">{creator.growthScore}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name & niche */}
                                    <div className="space-y-3 relative z-10">
                                        <h3 className="text-2xl font-bold text-heaven-text tracking-tight uppercase leading-none">{displayName}</h3>
                                        {creator.niche && (
                                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] flex items-center gap-3 opacity-50">
                                                <Target className="w-3 h-3 text-primary" /> {creator.niche}
                                            </p>
                                        )}
                                        {creator.bio && (
                                            <p className="text-xs text-heaven-muted/50 leading-relaxed line-clamp-2">{creator.bio}</p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-6 py-8 border-y border-white/[0.05] relative z-10">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40">Audience</p>
                                            <p className="text-xl font-bold text-heaven-text tracking-tighter">
                                                {creator.followers > 0 ? formatFollowers(creator.followers) : '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40">Location</p>
                                            <p className="text-sm font-bold text-heaven-text truncate flex items-center gap-2">
                                                {creator.location ? (
                                                    <><MapPin className="w-3 h-3 text-secondary opacity-60 shrink-0" />{creator.location.split(',')[0]}</>
                                                ) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        onClick={() => handleSendRequest(creator._id, displayName)}
                                        disabled={hasRequested}
                                        variant={hasRequested ? 'secondary' : 'primary'}
                                        className={cn(
                                            'w-full h-16 text-[11px] font-bold uppercase tracking-widest relative z-10 shadow-glass rounded-[2rem] transition-all',
                                            hasRequested && 'bg-white/[0.04] text-heaven-muted hover:text-heaven-text cursor-not-allowed'
                                        )}
                                    >
                                        {hasRequested ? '✓ Proposal Sent' : <><Send className="w-4 h-4 mr-3" />Send Proposal</>}
                                    </Button>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > 20 && (
                <div className="flex justify-center gap-4 pt-8">
                    <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-12 px-8 rounded-2xl border-white/10">← Prev</Button>
                    <span className="flex items-center text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Page {page}</span>
                    <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="h-12 px-8 rounded-2xl border-white/10">Next →</Button>
                </div>
            )}
        </div>
    );
}


