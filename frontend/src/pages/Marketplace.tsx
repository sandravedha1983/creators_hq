import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    ShoppingBag, Search, Filter, Plus, Users,
    ArrowLeft, CheckCircle, XCircle, Clock, Zap, Megaphone, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";
import {
    getCampaigns, getMyCampaigns, createCampaign,
    applyToCampaign, getMyApplications, getCampaignApplications,
    updateApplicationStatus
} from "@/services/campaignService";
import type { Campaign, CampaignApplication } from "@/services/campaignService";

export default function Marketplace() {
    const { user } = useAuth();
    const [view, setView] = useState<'browse' | 'create' | 'manage'>('browse');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [myApplications, setMyApplications] = useState<CampaignApplication[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [applications, setApplications] = useState<CampaignApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [nicheFilter, setNicheFilter] = useState('');

    const isBrand = user?.role === 'brand' || user?.role === 'admin';
    const isCreator = user?.role === 'creator';

    const [newCampaign, setNewCampaign] = useState({
        title: '', description: '', budget: '', niche: '', deliverables: '', deadline: '', image: ''
    });

    // ── Load data ─────────────────────────────────────────────────────────────
    const loadCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            if (isBrand) {
                const res = await getMyCampaigns();
                setCampaigns(res.data || []);
            } else {
                const res = await getCampaigns({ search, niche: nicheFilter });
                setCampaigns(res.data || []);
            }
            if (isCreator) {
                const appsRes = await getMyApplications();
                setMyApplications(appsRes.data || []);
            }
        } catch (err) {
            console.error('[Marketplace] Load failed', err);
        } finally {
            setLoading(false);
        }
    }, [isBrand, isCreator, search, nicheFilter]);

    useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

    const loadApplications = async (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setView('manage');
        try {
            const res = await getCampaignApplications(campaign._id);
            setApplications(res.data || []);
        } catch { setApplications([]); }
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaign.title || !newCampaign.description || !newCampaign.budget) {
            toast.error('Title, description and budget are required.'); return;
        }
        setSaving(true);
        const toastId = toast.loading('Creating campaign...');
        try {
            await createCampaign({ ...newCampaign, status: 'open' });
            toast.success('Campaign created!', { id: toastId });
            setNewCampaign({ title: '', description: '', budget: '', niche: '', deliverables: '', deadline: '', image: '' });
            setView('browse');
            await loadCampaigns();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create.', { id: toastId });
        } finally { setSaving(false); }
    };

    const hasApplied = (campaignId: string) =>
        myApplications.some(a => {
            const cid = typeof a.campaign_id === 'string' ? a.campaign_id : (a.campaign_id as Campaign)?._id;
            return cid === campaignId;
        });

    const handleApply = async (campaign: Campaign) => {
        if (hasApplied(campaign._id)) { toast.error('Already applied.'); return; }
        const toastId = toast.loading('Submitting application...');
        try {
            await applyToCampaign(campaign._id);
            toast.success('Application submitted!', { id: toastId });
            const appsRes = await getMyApplications();
            setMyApplications(appsRes.data || []);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Application failed.';
            toast.error(msg, { id: toastId });
        }
    };

    const handleUpdateApp = async (appId: string, status: 'approved' | 'rejected') => {
        if (!selectedCampaign) return;
        const toastId = toast.loading(`${status === 'approved' ? 'Approving' : 'Rejecting'}...`);
        try {
            await updateApplicationStatus(selectedCampaign._id, appId, status);
            toast.success(`Application ${status}.`, { id: toastId });
            const res = await getCampaignApplications(selectedCampaign._id);
            setApplications(res.data || []);
        } catch { toast.error('Failed.', { id: toastId }); }
    };

    // ── Manage view (brand — see applicants) ──────────────────────────────────
    if (view === 'manage' && selectedCampaign) {
        return (
            <div className="space-y-12 animate-fade-in pb-20 max-w-6xl mx-auto">
                <div className="flex items-center gap-8">
                    <Button variant="secondary" onClick={() => setView('browse')} className="p-0 h-14 w-14 rounded-2xl bg-white/[0.04] border-white/[0.08]">
                        <ArrowLeft className="w-6 h-6 text-heaven-text" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-heaven-text tracking-tight uppercase">{selectedCampaign.title}</h1>
                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-40">Campaign Applications</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <Card className="lg:col-span-4 p-10 border-white/[0.08] bg-white/[0.04] rounded-[3.5rem] space-y-8 shadow-glass h-fit">
                        {selectedCampaign.image && (
                            <img src={selectedCampaign.image} className="w-full h-44 object-cover rounded-[2rem] border border-white/[0.08]" alt="" />
                        )}
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40 mb-1">Budget</p>
                                <p className="text-2xl font-bold text-primary">{selectedCampaign.budget}</p>
                            </div>
                            {selectedCampaign.niche && (
                                <div>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40 mb-1">Niche</p>
                                    <p className="text-sm font-bold text-heaven-text uppercase">{selectedCampaign.niche}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40 mb-1">Brief</p>
                                <p className="text-sm text-heaven-muted/60 leading-relaxed">{selectedCampaign.description}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="lg:col-span-8 p-12 border-white/[0.08] bg-white/[0.04] rounded-[3.5rem] shadow-glass">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-2xl font-bold text-heaven-text uppercase tracking-tight">
                                Applicants <span className="text-heaven-muted/20 ml-2">({applications.length})</span>
                            </h3>
                            <Button variant="secondary" onClick={() => getCampaignApplications(selectedCampaign._id).then(r => setApplications(r.data || []))} className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase border-white/10">
                                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                            </Button>
                        </div>
                        {applications.length === 0 ? (
                            <div className="text-center py-24 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/[0.08]">
                                <Users className="w-16 h-16 text-heaven-muted/10 mx-auto mb-6" />
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40">No applicants yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {applications.map(app => {
                                    const creator = typeof app.creator_id === 'object' ? app.creator_id as any : null;
                                    return (
                                        <div key={app._id} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.08] flex items-center justify-between group hover:border-primary/20 transition-all duration-500">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-dark rounded-xl flex items-center justify-center font-bold text-primary border border-white/[0.08]">
                                                    {(creator?.name || 'C')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-heaven-text text-sm uppercase tracking-widest">{creator?.name || 'Creator'}</p>
                                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-40">{creator?.email}</p>
                                                    {app.message && <p className="text-xs text-heaven-muted/50 mt-1 italic">"{app.message}"</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {app.status === 'pending' ? (
                                                    <>
                                                        <button onClick={() => handleUpdateApp(app._id, 'approved')} className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:scale-110 transition-transform flex items-center justify-center">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleUpdateApp(app._id, 'rejected')} className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:scale-110 transition-transform flex items-center justify-center">
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={cn('px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest',
                                                        app.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    )}>{app.status}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // ── Create view (brand) ───────────────────────────────────────────────────
    if (view === 'create') {
        return (
            <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20">
                <div className="flex items-center gap-8">
                    <Button variant="secondary" onClick={() => setView('browse')} className="p-0 h-14 w-14 rounded-2xl bg-white/[0.04] border-white/[0.08]">
                        <ArrowLeft className="w-6 h-6 text-heaven-text" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-heaven-text tracking-tight uppercase">New Campaign</h1>
                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-40">Define requirements and budget</p>
                    </div>
                </div>
                <Card className="p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4rem] shadow-glass">
                    <form onSubmit={handleCreate} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Title *</label>
                                <Input value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="Summer Lifestyle 2026" className="h-14 rounded-[2rem]" autoFocus />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Budget * (₹)</label>
                                <Input value={newCampaign.budget} onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })} placeholder="₹50,000" className="h-14 rounded-[2rem]" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Niche</label>
                                <Input value={newCampaign.niche} onChange={e => setNewCampaign({ ...newCampaign, niche: e.target.value })} placeholder="e.g. Fitness, Tech" className="h-14 rounded-[2rem]" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Deadline</label>
                                <Input type="date" value={newCampaign.deadline} onChange={e => setNewCampaign({ ...newCampaign, deadline: e.target.value })} className="h-14 rounded-[2rem]" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Description *</label>
                                <textarea value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Describe goals, expectations, and deliverables..." className="w-full h-36 p-6 rounded-[2rem] border border-white/[0.08] bg-white/[0.02] text-heaven-text resize-none outline-none text-sm placeholder:text-heaven-muted/20 focus:border-primary/30 transition-all" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Deliverables</label>
                                <Input value={newCampaign.deliverables} onChange={e => setNewCampaign({ ...newCampaign, deliverables: e.target.value })} placeholder="e.g. 3 Instagram Reels, 1 YouTube video" className="h-14 rounded-[2rem]" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Cover Image URL</label>
                                <Input value={newCampaign.image} onChange={e => setNewCampaign({ ...newCampaign, image: e.target.value })} placeholder="https://..." className="h-14 rounded-[2rem]" />
                            </div>
                        </div>
                        <Button type="submit" variant="primary" className="w-full h-16 rounded-[2rem] shadow-soft-glow font-bold uppercase tracking-widest" disabled={saving}>
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Launch Campaign'}
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    // ── Browse view ───────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in pb-20 space-y-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase leading-none">Marketplace</h1>
                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.4em] mt-4 flex items-center gap-4 opacity-50">
                        <Megaphone className="w-4 h-4 text-primary animate-pulse" />
                        {isBrand ? 'Manage your live opportunities' : 'Discover and apply to open campaigns'}
                    </p>
                </div>
                <div className="flex gap-4">
                    {isBrand && (
                        <Button onClick={() => setView('create')} variant="primary" className="flex items-center gap-3 h-14 px-10 rounded-[2rem] shadow-soft-glow font-bold text-[10px] uppercase tracking-widest">
                            <Plus className="w-5 h-5" /> New Campaign
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters (creator only) */}
            {isCreator && (
                <div className="flex flex-col lg:flex-row gap-6">
                    <Card className="flex-1 p-3 bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] flex items-center gap-4">
                        <Search className="w-5 h-5 text-heaven-muted/40 ml-6" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="border-0 bg-transparent shadow-none h-12 px-0 focus-visible:ring-0 flex-1 text-heaven-text font-bold text-[11px] placeholder:text-heaven-muted/20" />
                    </Card>
                    <Input value={nicheFilter} onChange={e => setNicheFilter(e.target.value)} placeholder="Filter by niche..." className="w-48 h-14 rounded-[2.5rem] bg-white/[0.04] border-white/[0.08]" />
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-52">
                    <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-40">
                    <div className="w-24 h-24 bg-white/[0.02] rounded-[3rem] flex items-center justify-center text-heaven-muted/10 mx-auto mb-8 border border-white/[0.08]">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase">No Campaigns Yet</h3>
                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest mt-4 opacity-40">
                        {isBrand ? 'Create your first campaign to connect with creators.' : 'Check back soon for new opportunities.'}
                    </p>
                    {isBrand && (
                        <Button onClick={() => setView('create')} variant="primary" className="mt-10 h-14 px-12 rounded-[2rem] shadow-soft-glow font-bold uppercase tracking-widest">
                            <Plus className="w-5 h-5 mr-3" /> Create Campaign
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {campaigns.map((campaign, idx) => {
                        const applied = hasApplied(campaign._id);
                        const brandName = typeof campaign.brand_id === 'object' ? (campaign.brand_id as any).name : 'Brand';
                        return (
                            <motion.div key={campaign._id} initial={{ opacity: 0, scale: 0.98, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: idx * 0.08, duration: 0.7 }}>
                                <Card className="group overflow-hidden flex flex-col border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-glass rounded-[3.5rem] transition-all duration-700 hover:scale-[1.02]">
                                    <div className="aspect-[16/10] relative overflow-hidden">
                                        {campaign.image ? (
                                            <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                                <Megaphone className="w-16 h-16 text-primary/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />
                                        <div className="absolute top-5 left-5">
                                            <span className={cn('px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border backdrop-blur-md',
                                                campaign.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-dark/60 text-heaven-muted border-white/10'
                                            )}>{campaign.status}</span>
                                        </div>
                                        <div className="absolute bottom-5 left-8 right-8">
                                            <h3 className="text-2xl font-bold text-heaven-text uppercase tracking-tight leading-tight">{campaign.title}</h3>
                                            <p className="text-[10px] font-bold text-heaven-muted/60 uppercase tracking-widest mt-1">{brandName}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col gap-6">
                                        <p className="text-sm text-heaven-muted/50 leading-relaxed line-clamp-2">{campaign.description}</p>
                                        <div className="grid grid-cols-2 gap-4 py-5 border-y border-white/[0.05]">
                                            <div>
                                                <p className="text-[9px] text-heaven-muted font-bold uppercase tracking-widest opacity-40 mb-1">Budget</p>
                                                <p className="font-bold text-primary text-lg">{campaign.budget}</p>
                                            </div>
                                            {campaign.niche && (
                                                <div className="text-right">
                                                    <p className="text-[9px] text-heaven-muted font-bold uppercase tracking-widest opacity-40 mb-1">Niche</p>
                                                    <p className="font-bold text-heaven-text text-sm uppercase">{campaign.niche}</p>
                                                </div>
                                            )}
                                        </div>
                                        {isBrand ? (
                                            <Button onClick={() => loadApplications(campaign)} variant="secondary" className="w-full h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-white/[0.04] border-white/[0.08]">
                                                Review Applicants
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleApply(campaign)}
                                                variant={applied ? 'secondary' : 'primary'}
                                                disabled={applied || campaign.status !== 'open'}
                                                className={cn('w-full h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest',
                                                    applied && 'opacity-60 bg-white/[0.04] border-white/[0.08] cursor-not-allowed'
                                                )}
                                            >
                                                {applied ? '✓ Applied' : campaign.status !== 'open' ? 'Closed' : 'Apply Now'}
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


