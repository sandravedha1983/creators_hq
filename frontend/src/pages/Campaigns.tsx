import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Plus, Megaphone, Calendar, Users,
    BarChart3, ChevronRight, MoreHorizontal,
    Target, Zap, Rocket, Clock, Flag, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';

export default function Campaigns() {
    const { campaigns, addCampaign } = useAppContext();
    const [view, setView] = useState<'active' | 'planning'>('active');
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaignTitle, setNewCampaignTitle] = useState('');
    const navigate = useNavigate();

    const handleLaunchProject = () => {
        console.log("Navigating to project launch pad...");
        setIsCreating(true);
    };

    const handleCreateCampaign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaignTitle) {
            toast.error("Please specify a mission objective (title).");
            return;
        }

        const toastId = toast.loading("Finalizing architectural parameters...");
        setTimeout(() => {
            addCampaign({
                title: newCampaignTitle,
                brand: 'CreatorsHQ Internal',
                status: 'Draft',
                budget: '₹15,000',
                applicants: []
            });
            setIsCreating(false);
            setNewCampaignTitle('');
            toast.success("Project launched into the stratosphere!", { id: toastId });
        }, 1500);
    };

    const handleViewLiveStream = (title: string) => {
        console.log(`Accessing live stream for: ${title}`);
        toast.success(`Encrypted uplink established for ${title}`);
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase leading-none">Campaign Studio</h1>
                    <p className="text-heaven-muted font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-4 opacity-50">
                        <Shield className="w-4 h-4 text-primary animate-pulse" />
                        Campaign Planning & Execution
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-[2.5rem] border border-white/[0.08] backdrop-blur-3xl shadow-glass">
                    <button
                        onClick={() => setView('active')}
                        className={cn(
                            "h-12 px-8 rounded-3xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all",
                            view === 'active' ? 'bg-primary text-white shadow-soft-glow' : 'bg-transparent text-heaven-muted hover:text-heaven-text'
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setView('planning')}
                        className={cn(
                            "h-12 px-8 rounded-3xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all",
                            view === 'planning' ? 'bg-primary text-white shadow-soft-glow' : 'bg-transparent text-heaven-muted hover:text-heaven-text'
                        )}
                    >
                        Planning
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Active Campaigns', value: campaigns.length, icon: Target, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'Total Reach', value: '0.00', icon: Users, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
                    { label: 'Avg Engagement', value: '0.0%', icon: Zap, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
                    { label: 'Completion Rate', value: '0.0%', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' }
                ].map((stat, i) => (
                    <Card key={i} className="p-8 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-glass flex items-center gap-6 group hover:scale-[1.02] transition-all duration-700 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors duration-700" />
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-soft-glow transition-transform group-hover:rotate-6 relative z-10", stat.bg, stat.color)}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {view === 'active' ? (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-10"
                    >
                        {isCreating ? (
                            <Card className="p-12 border-primary/20 bg-primary/5 rounded-[3rem] animate-fade-in">
                                <h3 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight">New Strategic Mission</h3>
                                <form onSubmit={handleCreateCampaign} className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest ml-2">Mission Objective (Title)</label>
                                        <Input 
                                            value={newCampaignTitle}
                                            onChange={(e) => setNewCampaignTitle(e.target.value)}
                                            placeholder="e.g. Q3 Lifestyle Breakthrough"
                                            className="h-16 rounded-2xl bg-black/40 border-white/10"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <Button type="submit" variant="primary" className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest">Deploy Mission</Button>
                                        <Button type="button" variant="secondary" onClick={() => setIsCreating(false)} className="h-16 px-10 rounded-2xl font-bold uppercase tracking-widest border-white/10">Abort</Button>
                                    </div>
                                </form>
                            </Card>
                        ) : campaigns.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {campaigns.map((c) => (
                                    <Card key={c.id} className="p-10 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3rem] group hover:border-primary/20 transition-all duration-700 shadow-glass overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000" />

                                        <div className="flex items-center justify-between mb-10 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-button-gradient text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-soft-glow">
                                                    {c.title[0]}
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-2xl font-bold text-heaven-text tracking-tight leading-none uppercase">{c.title}</h4>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-1">{c.brand}</p>
                                                </div>
                                            </div>
                                            <div className="px-5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-soft-glow">
                                                {c.status}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 mb-10 p-8 bg-black/40 rounded-[2.5rem] border border-white/[0.05] relative z-10">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-30">Allocated Budget</p>
                                                <p className="text-2xl font-bold text-heaven-text tracking-tight uppercase">{c.budget}</p>
                                            </div>
                                            <div className="text-right space-y-3">
                                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-30">Active Applicants</p>
                                                <p className="text-2xl font-bold text-heaven-text tracking-tight uppercase">{c.applicants.length}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 relative z-10">
                                            <Button 
                                                variant="primary" 
                                                className="flex-1 h-16 text-[10px] font-bold uppercase tracking-[0.3em] rounded-[2rem] shadow-soft-glow"
                                                onClick={() => handleViewLiveStream(c.title)}
                                            >
                                                View Live Stream
                                            </Button>
                                            <Button variant="secondary" className="w-16 h-16 p-0 rounded-[2rem] bg-white/[0.02] border border-white/10 text-heaven-muted hover:text-heaven-text transition-all">
                                                <MoreHorizontal className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <EmptyState 
                                title="Studio Inactive"
                                description="Your project portfolio is currently empty. Initiate a new campaign to begin building traction and collaborations."
                                icon={Rocket}
                                actionLabel="Launch New Project"
                                onClick={handleLaunchProject}
                                className="py-40"
                            />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="planning"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-10"
                    >
                        <Card className="p-20 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] shadow-glass relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px] group-hover:bg-primary/10 transition-colors duration-1000" />

                            <div className="flex items-center justify-between mb-16 relative z-10">
                                <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase">Strategic Roadmap</h3>
                                <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-heaven-muted/40">
                                    <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-primary rounded-full shadow-soft-glow" /> Drafting</div>
                                    <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-secondary rounded-full opacity-20" /> Queue</div>
                                </div>
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div className="text-center py-32 bg-black/40 rounded-[3.5rem] border border-dashed border-white/[0.08] flex flex-col items-center space-y-8">
                                    <Clock className="w-16 h-16 text-heaven-muted/5 animate-pulse" />
                                    <p className="text-[11px] font-bold text-heaven-muted/20 uppercase tracking-[0.5em] ml-[0.5em]">Planning module initialization required.</p>
                                </div>
                            </div>

                            <Button variant="primary" className="w-full mt-16 h-20 text-[11px] font-bold uppercase tracking-[0.5em] rounded-[2.5rem] shadow-soft-glow">
                                Start Architectural Planning
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
