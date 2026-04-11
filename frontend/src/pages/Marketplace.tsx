import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    ShoppingBag, Search, DollarSign, ExternalLink,
    ChevronRight, Filter, Globe, Plus, Users,
    ArrowLeft, CheckCircle2, XCircle, Clock, Zap, Cpu, Share2
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";

export default function Marketplace() {
    const { campaigns, addCampaign, applyToCampaign } = useAppContext();
    const { user } = useAuth();
    const [view, setView] = useState<'browse' | 'create' | 'manage'>('browse');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    const [newCampaign, setNewCampaign] = useState({
        title: '',
        description: '',
        budget: '',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'
    });

    const isBrand = user?.role === 'brand';

    const handleCreateCampaign = () => {
        if (!newCampaign.title || !newCampaign.budget) {
            toast.error('Title and budget are required');
            return;
        }
        addCampaign({
            ...newCampaign,
            brand: user?.name || 'Unknown Brand',
            brandId: user?.email || '',
        });
        setNewCampaign({ title: '', description: '', budget: '', image: newCampaign.image });
        setView('browse');
        toast.success('Campaign created successfully');
    };

    const myCampaigns = campaigns.filter(c => c.brandId === user?.email);
    const availableCampaigns = campaigns.filter(c => c.status !== 'Closed');
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    if (view === 'create') {
        return (
            <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20">
                <div className="flex items-center gap-8">
                    <Button 
                        variant="secondary" 
                        onClick={() => setView('browse')} 
                        className="p-0 h-14 w-14 rounded-2xl bg-white/[0.04] border-white/[0.08]"
                    >
                        <ArrowLeft className="w-6 h-6 text-heaven-text" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-heaven-text tracking-tight">Create Campaign</h1>
                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-3 opacity-40">Define your project requirements</p>
                    </div>
                </div>
                <Card className="p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4rem] space-y-10 shadow-glass">
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-2 opacity-50">Campaign Title</label>
                            <Input
                                value={newCampaign.title}
                                onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                                placeholder="Summer Lifestyle Collection 2024"
                                className="h-16 rounded-[2rem]"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-2 opacity-50">Project Brief</label>
                            <textarea
                                value={newCampaign.description}
                                onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                placeholder="Describe your expectations, deliverables, and targets..."
                                className="w-full h-48 p-8 rounded-[2rem] border border-white/[0.08] bg-white/[0.02] focus:border-primary/30 transition-all font-medium resize-none outline-none text-heaven-text text-sm placeholder:text-heaven-muted/20"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-2 opacity-50">Budget Allocation (₹)</label>
                            <Input
                                value={newCampaign.budget}
                                onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                                placeholder="50,000"
                                className="h-16 rounded-[2rem]"
                            />
                        </div>
                    </div>
                    <Button onClick={handleCreateCampaign} variant="primary" className="w-full h-20 rounded-[2.5rem] shadow-soft-glow">
                        Launch Campaign
                    </Button>
                </Card>
            </div>
        );
    }

    if (view === 'manage' && selectedCampaign) {
        return (
            <div className="space-y-12 animate-fade-in pb-20">
                <div className="flex items-center gap-8">
                    <Button 
                        variant="secondary" 
                        onClick={() => setView('browse')} 
                        className="p-0 h-14 w-14 rounded-2xl bg-white/[0.04] border-white/[0.08]"
                    >
                        <ArrowLeft className="w-6 h-6 text-heaven-text" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-heaven-text tracking-tight">{selectedCampaign.title}</h1>
                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-3 opacity-40">Reviewing applicants and progress</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <Card className="lg:col-span-4 p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] space-y-8 relative overflow-hidden shadow-glass h-fit">
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <img src={selectedCampaign.image} className="w-full h-56 object-cover rounded-[2rem] relative z-10 border border-white/[0.08] shadow-glass" alt="" />
                        <div className="space-y-3 relative z-10">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">Project Status</p>
                            <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-widest text-xs">
                                <Clock className="w-4 h-4 animate-pulse" />
                                {selectedCampaign.status}
                            </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">Project Brief</p>
                            <p className="text-heaven-muted text-sm font-medium leading-relaxed opacity-60">{selectedCampaign.description || "No description provided."}</p>
                        </div>
                    </Card>

                    <Card className="lg:col-span-8 p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] shadow-glass">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-2xl font-bold text-heaven-text tracking-tight uppercase">Applied Creators <span className="text-heaven-muted/20 ml-2">({selectedCampaign.applicants.length})</span></h3>
                            <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center text-heaven-muted">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        {selectedCampaign.applicants.length > 0 ? (
                            <div className="space-y-6">
                                {selectedCampaign.applicants.map(email => (
                                    <div key={email} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.08] flex items-center justify-between group hover:border-primary/20 transition-all duration-500">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-dark rounded-2xl flex items-center justify-center font-bold text-primary border border-white/[0.08] shadow-glass">
                                                {email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-heaven-text text-sm uppercase tracking-[0.1em]">{email.split('@')[0]}</p>
                                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] mt-1 opacity-40">{email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Button variant="secondary" className="h-12 w-12 p-0 text-primary bg-primary/10 border-primary/20 rounded-xl hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></Button>
                                            <Button variant="secondary" className="h-12 w-12 p-0 text-accent bg-accent/10 border-accent/20 rounded-xl hover:scale-110 transition-transform"><XCircle className="w-5 h-5" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/[0.08]">
                                <Users className="w-16 h-16 text-heaven-muted/10 mx-auto mb-6" />
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40">No applicants yet for this campaign.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-bold text-heaven-text tracking-tight">Campaign Marketplace</h1>
                    <p className="text-heaven-muted text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-3 opacity-50">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        {isBrand ? 'Manage your live opportunities' : 'Discover and apply to open tasks'}
                    </p>
                </div>
                {isBrand && (
                    <Button onClick={() => setView('create')} variant="primary" className="flex items-center gap-4 h-16 px-10 rounded-[2rem] shadow-soft-glow">
                        <Plus className="w-5 h-5" />
                        New Campaign
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {(isBrand ? myCampaigns : availableCampaigns).map((campaign, idx) => (
                    <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card className="group overflow-hidden flex flex-col border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-glass rounded-[3.5rem] transition-all duration-700 hover:scale-[1.02]">
                            <div className="aspect-[16/11] relative overflow-hidden">
                                <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent opacity-90" />
                                <div className="absolute top-6 left-6">
                                    <div className="px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-glass bg-dark/60 backdrop-blur-md text-primary border border-primary/20">
                                        {campaign.status}
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-10 right-10">
                                    <h3 className="text-2xl font-bold text-heaven-text leading-tight tracking-tight mb-2 uppercase">{campaign.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-[8px]">
                                            {campaign.brand[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-heaven-muted text-[10px] uppercase tracking-[0.2em] opacity-60">{campaign.brand}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-6 mb-10 pb-8 border-b border-white/[0.05]">
                                    <div>
                                        <p className="text-[9px] text-heaven-muted font-bold uppercase tracking-[0.2em] mb-2 opacity-40">Compensation</p>
                                        <p className="font-bold text-primary text-xl flex items-center gap-1 tracking-tight">
                                            ₹{(parseInt(campaign.budget) || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-heaven-muted font-bold uppercase tracking-[0.2em] mb-2 opacity-40">
                                            {isBrand ? 'Participants' : 'Status'}
                                        </p>
                                        <p className="font-bold text-heaven-text text-xl uppercase tracking-tighter">
                                            {isBrand ? `${campaign.applicants.length}` : (campaign.applicants.includes(user?.email || '') ? 'Applied' : 'Open')}
                                        </p>
                                    </div>
                                </div>

                                {isBrand ? (
                                    <Button
                                        onClick={() => { setSelectedCampaignId(campaign.id); setView('manage'); }}
                                        variant="secondary"
                                        className="w-full h-14 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]"
                                    >
                                        Review Applicants
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            applyToCampaign(campaign.id, user?.email || '');
                                            toast.success('Your application has been received');
                                        }}
                                        variant={campaign.applicants.includes(user?.email || '') ? "secondary" : "primary"}
                                        className={cn(
                                            "w-full h-14 rounded-2xl",
                                            campaign.applicants.includes(user?.email || '') && "opacity-50 cursor-not-allowed bg-white/[0.04] border-white/[0.08]"
                                        )}
                                        disabled={campaign.applicants.includes(user?.email || '')}
                                    >
                                        {campaign.applicants.includes(user?.email || '') ? 'Applied' : 'Apply to Task'}
                                        {!campaign.applicants.includes(user?.email || '') && <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {(isBrand ? myCampaigns : availableCampaigns).length === 0 && (
                <div className="text-center py-40">
                    <div className="w-24 h-24 bg-white/[0.02] rounded-[3rem] flex items-center justify-center text-heaven-muted/10 mx-auto mb-8 border border-white/[0.08]">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-heaven-text tracking-tight">No Active Campaigns</h3>
                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mt-4 opacity-40">Be the first to create one for your network.</p>
                </div>
            )}
        </div>
    );
}
