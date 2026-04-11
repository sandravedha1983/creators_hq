import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Filter, Users, Star, ArrowUpRight, ShieldCheck, Mail, MapPin, Target, Zap, Shield, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

interface Creator {
    id: string;
    name: string;
    niche: string;
    followers: string;
    location: string;
    avatar: string;
    verified: boolean;
}

const ALL_CREATORS: Creator[] = [];

export default function Creators() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('All');
    const [requestSent, setRequestSent] = useState<string[]>([]);

    const filteredCreators = useMemo(() => {
        return ALL_CREATORS.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.niche.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesNiche = selectedNiche === 'All' || c.niche === selectedNiche;
            return matchesSearch && matchesNiche;
        });
    }, [searchQuery, selectedNiche]);

    const handleSendRequest = (id: string, name: string) => {
        if (requestSent.includes(id)) return;
        
        const promise = new Promise((resolve) => {
            setTimeout(() => {
                setRequestSent(prev => [...prev, id]);
                resolve(true);
            }, 1000);
        });

        toast.promise(promise, {
            loading: `Sending proposal to ${name}...`,
            success: `Proposal sent to ${name}`,
            error: 'Failed to send proposal.',
        });
    };

    const niches = ['All', 'Technology', 'Lifestyle', 'Fashion', 'Health'];

    return (
        <div className="space-y-16 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase cursor-default">Talent Discovery</h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <Users className="w-4 h-4 text-primary animate-pulse" />
                        Accessing Global Creator Network
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" className="h-16 px-10 rounded-[2.25rem] font-bold text-[10px] uppercase tracking-[0.3em] bg-white/[0.04] border-white/[0.08] text-heaven-muted hover:text-heaven-text shadow-glass transition-all">
                        Recent Invites
                    </Button>
                    <Button variant="primary" className="h-16 px-10 rounded-[2.25rem] gap-4 font-bold text-[10px] uppercase tracking-[0.3em] shadow-soft-glow hover:scale-[1.02] transition-all">
                        <Users className="w-5 h-5 shadow-sm" />
                        Invite Member
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                <Card className="flex-1 p-4 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] flex items-center gap-8 group focus-within:border-primary/20 transition-all shadow-glass">
                    <Search className="w-6 h-6 text-heaven-muted ml-8 group-focus-within:text-primary transition-colors opacity-40" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, handle or niche..."
                        className="border-0 bg-transparent shadow-none h-16 px-0 focus-visible:ring-0 flex-1 text-heaven-text font-bold text-[11px] uppercase tracking-widest placeholder:text-heaven-muted/10"
                    />
                </Card>
                <div className="flex gap-4 overflow-x-auto pb-6 -mb-6 no-scrollbar items-center">
                    {niches.map(niche => (
                        <Button
                            key={niche}
                            onClick={() => setSelectedNiche(niche)}
                            className={cn(
                                "h-14 px-10 rounded-2xl transition-all whitespace-nowrap text-[10px] font-bold uppercase tracking-widest border shadow-glass",
                                selectedNiche === niche
                                    ? 'bg-primary text-white border-primary/20 shadow-soft-glow'
                                    : 'bg-white/[0.04] text-heaven-muted border-white/[0.08] hover:bg-white/[0.08] hover:text-heaven-text'
                            )}
                        >
                            {niche}
                        </Button>
                    ))}
                </div>
            </div>

            {filteredCreators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {filteredCreators.map((creator, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            key={creator.id}
                        >
                            <Card className={cn(
                                "p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl rounded-[4rem] hover:scale-[1.02] transition-all duration-700 flex flex-col gap-10 relative group overflow-hidden shadow-glass",
                                requestSent.includes(creator.id) && "opacity-80 border-primary/10"
                            )}>
                                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="w-22 h-22 bg-primary/10 border border-primary/20 text-primary rounded-[2.5rem] flex items-center justify-center font-bold text-3xl shadow-glass transition-transform group-hover:rotate-6">
                                        {creator.avatar}
                                    </div>
                                    {creator.verified && (
                                        <div className="p-4 bg-secondary/10 border border-secondary/20 text-secondary rounded-2xl shadow-glass">
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase leading-none">{creator.name}</h3>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] flex items-center gap-4 opacity-40">
                                        <Target className="w-4 h-4 text-primary" />
                                        {creator.niche}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-10 py-10 border-y border-white/[0.05] relative z-10">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">Audience</p>
                                        <p className="text-2xl font-bold text-heaven-text tracking-tighter">{creator.followers}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">Domain</p>
                                        <p className="text-2xl font-bold text-heaven-text tracking-tighter truncate flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-secondary opacity-60" />
                                            {creator.location.split(',')[0]}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleSendRequest(creator.id, creator.name)}
                                    disabled={requestSent.includes(creator.id)}
                                    variant={requestSent.includes(creator.id) ? "secondary" : "primary"}
                                    className={cn(
                                        "w-full h-20 text-[11px] font-bold uppercase tracking-[0.4em] relative z-10 shadow-glass rounded-[2.25rem] transition-all",
                                        requestSent.includes(creator.id) && "bg-white/[0.04] text-heaven-muted hover:text-heaven-text"
                                    )}
                                >
                                    {requestSent.includes(creator.id) ? (
                                        <span className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Proposal Sent</span>
                                    ) : (
                                        <span className="flex items-center gap-3">Send Proposal <ArrowUpRight className="w-5 h-5" /></span>
                                    )}
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="py-60 border-2 border-dashed border-white/[0.08] rounded-[6rem] bg-white/[0.02] flex flex-col items-center text-center backdrop-blur-xl">
                    <div className="w-32 h-32 bg-white/[0.04] rounded-[3.5rem] shadow-glass border border-white/[0.08] flex items-center justify-center text-heaven-muted/10 mb-12 opacity-20">
                        <Search className="w-16 h-16" />
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase leading-none cursor-default">No Creators Identified</h3>
                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] max-w-sm mx-auto leading-loose opacity-40">Search for specific handles or niches to discover top-tier talent for your brand.</p>
                    </div>
                    <Button
                        onClick={() => { setSearchQuery(''); setSelectedNiche('All'); }}
                        variant="primary"
                        className="h-20 px-20 text-[11px] font-bold uppercase tracking-[0.5em] rounded-[2.5rem] mt-16 shadow-soft-glow"
                    >
                        Reset Search
                    </Button>
                </Card>
            )}
        </div>
    );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
