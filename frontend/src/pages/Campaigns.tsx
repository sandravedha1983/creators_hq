import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Megaphone, Calendar, Users,
    BarChart3, MoreHorizontal, Target, Zap, Rocket, Clock, Shield, Trash2, Edit2, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { deleteCampaign, updateCampaign } from '@/services/campaignService';

export default function Campaigns() {
    const { campaigns, addCampaign, campaignsLoading, refreshCampaigns } = useAppContext();
    const { user } = useAuth();
    const [view, setView] = useState<'active' | 'planning'>('active');
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const [newCampaign, setNewCampaign] = useState({
        title: '', description: '', budget: '', niche: '', image: ''
    });

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaign.title || !newCampaign.description || !newCampaign.budget) {
            toast.error('Title, description, and budget are required.');
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading('Launching campaign...');
        try {
            await addCampaign(newCampaign);
            setIsCreating(false);
            setNewCampaign({ title: '', description: '', budget: '', niche: '', image: '' });
            toast.success('Campaign launched!', { id: toastId });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create campaign.', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete campaign "${title}"? This cannot be undone.`)) return;
        const toastId = toast.loading('Deleting...');
        try {
            await deleteCampaign(id);
            await refreshCampaigns();
            toast.success('Campaign deleted.', { id: toastId });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Delete failed.', { id: toastId });
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        const toastId = toast.loading('Updating status...');
        try {
            await updateCampaign(id, { status: status as any });
            await refreshCampaigns();
            toast.success(`Campaign ${status}.`, { id: toastId });
        } catch {
            toast.error('Failed to update status.', { id: toastId });
        }
    };

    const isBrand = user?.role === 'brand' || user?.role === 'admin';
    const activeCampaigns = campaigns.filter(c => c.status === 'open' || c.status === 'paused');
    const draftCampaigns = campaigns.filter(c => c.status === 'draft');

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
                    {(['active', 'planning'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)}
                            className={cn('h-12 px-8 rounded-3xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all',
                                view === v ? 'bg-primary text-white shadow-soft-glow' : 'bg-transparent text-heaven-muted hover:text-heaven-text'
                            )}>
                            {v === 'active' ? 'Active' : 'Drafts'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Active Campaigns', value: activeCampaigns.length, icon: Target, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'Drafts', value: draftCampaigns.length, icon: Clock, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
                    { label: 'Total', value: campaigns.length, icon: BarChart3, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
                    { label: 'Total Budget', value: campaigns.reduce((a, c) => a + parseInt(c.budget?.replace(/[^0-9]/g, '') || '0'), 0) > 0
                        ? `₹${campaigns.reduce((a, c) => a + parseInt(c.budget?.replace(/[^0-9]/g, '') || '0'), 0).toLocaleString()}` : '—', icon: Zap, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' }
                ].map((stat, i) => (
                    <Card key={i} className="p-8 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-glass flex items-center gap-6 group hover:scale-[1.02] transition-all duration-700 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors duration-700" />
                        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center border shadow-soft-glow transition-transform group-hover:rotate-6 relative z-10', stat.bg, stat.color)}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight">{campaignsLoading ? '...' : stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {view === 'active' ? (
                    <motion.div key="active" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.6 }} className="space-y-10">
                        {/* Create form (brands only) */}
                        {isBrand && (
                            <AnimatePresence>
                                {isCreating ? (
                                    <motion.div key="form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        <Card className="p-12 border-primary/20 bg-primary/5 rounded-[3rem]">
                                            <h3 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight">New Campaign</h3>
                                            <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-60">Title *</label>
                                                    <Input value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="e.g. Q3 Lifestyle Campaign" className="h-14 rounded-2xl bg-black/40 border-white/10" autoFocus />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-60">Budget *</label>
                                                    <Input value={newCampaign.budget} onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })} placeholder="e.g. ₹50,000" className="h-14 rounded-2xl bg-black/40 border-white/10" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-60">Niche</label>
                                                    <Input value={newCampaign.niche} onChange={e => setNewCampaign({ ...newCampaign, niche: e.target.value })} placeholder="e.g. Fitness, Tech" className="h-14 rounded-2xl bg-black/40 border-white/10" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-60">Image URL</label>
                                                    <Input value={newCampaign.image} onChange={e => setNewCampaign({ ...newCampaign, image: e.target.value })} placeholder="https://..." className="h-14 rounded-2xl bg-black/40 border-white/10" />
                                                </div>
                                                <div className="md:col-span-2 space-y-3">
                                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-60">Description *</label>
                                                    <textarea value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Describe the campaign goals and deliverables..." className="w-full h-28 p-4 rounded-2xl bg-black/40 border border-white/10 text-white resize-none text-sm placeholder:text-white/20" />
                                                </div>
                                                <div className="md:col-span-2 flex gap-4">
                                                    <Button type="submit" variant="primary" className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest" disabled={isSaving}>
                                                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Launch Campaign'}
                                                    </Button>
                                                    <Button type="button" variant="secondary" onClick={() => setIsCreating(false)} className="h-14 px-10 rounded-2xl font-bold uppercase tracking-widest border-white/10">Cancel</Button>
                                                </div>
                                            </form>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <Button onClick={() => setIsCreating(true)} variant="primary" className="h-14 px-10 rounded-2xl gap-3 font-bold text-[10px] uppercase tracking-widest shadow-soft-glow">
                                        <Plus className="w-5 h-5" /> New Campaign
                                    </Button>
                                )}
                            </AnimatePresence>
                        )}

                        {/* Campaign cards */}
                        {campaignsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : activeCampaigns.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {activeCampaigns.map((c) => (
                                    <Card key={c._id} className="p-10 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3rem] group hover:border-primary/20 transition-all duration-700 shadow-glass overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000" />
                                        {c.image && (
                                            <img src={c.image} alt={c.title} className="w-full h-32 object-cover rounded-2xl mb-8 opacity-70" />
                                        )}
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-button-gradient text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-soft-glow">
                                                    {c.title[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-heaven-text tracking-tight uppercase">{c.title}</h4>
                                                    {c.niche && <p className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">{c.niche}</p>}
                                                </div>
                                            </div>
                                            <span className={cn('px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                                                c.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                c.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-white/5 text-heaven-muted border-white/10'
                                            )}>{c.status}</span>
                                        </div>
                                        <p className="text-sm text-heaven-muted/60 mb-8 relative z-10 line-clamp-2">{c.description}</p>
                                        <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-black/40 rounded-[2rem] border border-white/[0.05] relative z-10">
                                            <div>
                                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-30 mb-1">Budget</p>
                                                <p className="text-xl font-bold text-heaven-text">{c.budget}</p>
                                            </div>
                                            {c.deadline && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-30 mb-1">Deadline</p>
                                                    <p className="text-sm font-bold text-heaven-text">{new Date(c.deadline).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                        {isBrand && (
                                            <div className="flex gap-3 relative z-10">
                                                <Button variant="primary" className="flex-1 h-12 text-[10px] font-bold uppercase tracking-widest rounded-[1.5rem] shadow-soft-glow" onClick={() => navigate(`/campaigns/${c._id}/applications`)}>
                                                    View Applications
                                                </Button>
                                                <button onClick={() => handleStatusChange(c._id, c.status === 'open' ? 'paused' : 'open')} className="w-12 h-12 rounded-[1.5rem] bg-white/[0.02] border border-white/10 text-heaven-muted hover:text-yellow-400 transition-all flex items-center justify-center">
                                                    {c.status === 'open' ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                </button>
                                                <button onClick={() => handleDelete(c._id, c.title)} className="w-12 h-12 rounded-[1.5rem] bg-white/[0.02] border border-white/10 text-heaven-muted hover:text-red-400 transition-all flex items-center justify-center">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No Active Campaigns"
                                description={isBrand ? "Launch your first campaign to start connecting with creators." : "No open campaigns at the moment. Check the Marketplace for opportunities."}
                                icon={Rocket}
                                actionLabel={isBrand ? "Launch Campaign" : "Browse Marketplace"}
                                onClick={() => isBrand ? setIsCreating(true) : navigate('/marketplace')}
                                className="py-40"
                            />
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="planning" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.6 }} className="space-y-10">
                        <Card className="p-16 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] shadow-glass">
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase mb-10">Draft Campaigns</h3>
                            {draftCampaigns.length === 0 ? (
                                <div className="text-center py-24 bg-black/40 rounded-[3rem] border border-dashed border-white/[0.08]">
                                    <Clock className="w-12 h-12 text-heaven-muted/10 animate-pulse mx-auto mb-6" />
                                    <p className="text-[11px] font-bold text-heaven-muted/20 uppercase tracking-[0.5em]">No drafts yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {draftCampaigns.map(c => (
                                        <Card key={c._id} className="p-8 border-white/[0.06] bg-white/[0.02] rounded-[2.5rem]">
                                            <h4 className="text-lg font-bold text-heaven-text uppercase">{c.title}</h4>
                                            <p className="text-sm text-heaven-muted/50 mt-2">{c.description}</p>
                                            {isBrand && (
                                                <Button variant="primary" className="mt-6 h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => handleStatusChange(c._id, 'open')}>
                                                    Publish
                                                </Button>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const RefreshCw = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);
