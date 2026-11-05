import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Users,
    Plus,
    Search,
    X,
    Trash2,
    DollarSign,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import API from '@/services/api';

interface Lead {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status: 'Hot' | 'Warm' | 'Cold';
    value: string;
    notes?: string;
    createdAt?: string;
    created_at?: string;
}

export default function CRM() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'Hot' as 'Hot' | 'Warm' | 'Cold',
        value: ''
    });

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'All') params.status = statusFilter;

            const res = await API.get('/api/leads', { params });
            if (res.data?.success) {
                setLeads(res.data.data || []);
            }
        } catch (err) {
            console.error('[CRM LOAD ERROR]', err);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLead.name.trim()) return;

        setSubmitting(true);
        try {
            const res = await API.post('/api/leads', newLead);
            if (res.data?.success) {
                toast.success('Connection created successfully! 🎉');
                setIsModalOpen(false);
                setNewLead({ name: '', email: '', phone: '', company: '', status: 'Hot', value: '' });
                fetchLeads();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create connection');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLead = async (id: string, name: string) => {
        try {
            await API.delete(`/api/leads/${id}`);
            toast.success(`Removed ${name} from directory`);
            setLeads(prev => prev.filter(l => (l.id || l._id) !== id));
        } catch {
            toast.error('Failed to delete connection');
        }
    };

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-bold text-heaven-text tracking-tight uppercase cursor-default">CRM & Lead Pipeline</h1>
                    <div className="text-heaven-muted text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        {leads.length} Active Connections
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button onClick={fetchLeads} variant="secondary" className="h-14 px-6 rounded-2xl border-white/10">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        variant="primary"
                        className="flex items-center gap-3 h-14 px-8 rounded-2xl shadow-soft-glow"
                    >
                        <Plus className="w-5 h-5" />
                        New Connection
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heaven-muted group-focus-within:text-primary transition-colors" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search connections by name, email, or company..."
                        className="pl-14 h-14 bg-white/[0.04] border-white/5 focus:bg-white/[0.06] focus:border-primary/20 rounded-2xl font-bold text-xs"
                    />
                </div>
                <div className="flex gap-2">
                    {(['All', 'Hot', 'Warm', 'Cold'] as const).map(s => (
                        <Button
                            key={s}
                            variant={statusFilter === s ? "primary" : "secondary"}
                            onClick={() => setStatusFilter(s)}
                            className="h-14 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="overflow-hidden border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Company</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Value</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Created</th>
                                <th className="px-10 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center text-heaven-muted/50">
                                        Loading CRM pipeline...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-24">
                                        <div className="flex flex-col items-center justify-center text-heaven-muted/20 space-y-6">
                                            <div className="w-20 h-20 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-inner">
                                                <Users className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-1 text-center">
                                                <p className="font-bold text-heaven-muted text-lg tracking-tight">No Connections Found</p>
                                                <p className="text-xs font-medium opacity-50">Create your first contact using the button above.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => {
                                    const leadId = lead.id || lead._id || '';
                                    return (
                                        <tr key={leadId} className="group hover:bg-white/[0.02] transition-all duration-500">
                                            <td className="px-10 py-8">
                                                <div>
                                                    <p className="text-base font-bold text-heaven-text tracking-tight uppercase leading-none">{lead.name}</p>
                                                    <p className="text-[11px] text-heaven-muted mt-2 font-medium opacity-60">{lead.email || 'No email specified'}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-xs font-bold text-heaven-text">{lead.company || '—'}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={cn(
                                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                                    lead.status === 'Hot' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                                    lead.status === 'Warm' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                    lead.status === 'Cold' && "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                                )}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-xs font-bold text-heaven-text flex items-center gap-1">
                                                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                                                    {lead.value || '—'}
                                                </p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] text-heaven-muted uppercase tracking-widest font-bold opacity-40">
                                                    {lead.created_at || lead.createdAt ? new Date(lead.created_at || lead.createdAt || '').toLocaleDateString() : 'Recent'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDeleteLead(leadId, lead.name)}
                                                    className="h-10 px-4 rounded-xl text-rose-400 hover:bg-rose-500/10 border-white/5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg p-10 bg-[#050810] border border-white/10 rounded-[3rem] shadow-glass relative space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-heaven-text uppercase">Add New Connection</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-heaven-muted hover:text-heaven-text">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateLead} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest">Name *</label>
                                    <Input
                                        required
                                        value={newLead.name}
                                        onChange={e => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Full Name / Brand Rep"
                                        className="h-14 bg-white/[0.04] border-white/10 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest">Email</label>
                                    <Input
                                        type="email"
                                        value={newLead.email}
                                        onChange={e => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="contact@brand.com"
                                        className="h-14 bg-white/[0.04] border-white/10 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest">Company</label>
                                        <Input
                                            value={newLead.company}
                                            onChange={e => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="Company Name"
                                            className="h-14 bg-white/[0.04] border-white/10 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest">Estimated Value</label>
                                        <Input
                                            value={newLead.value}
                                            onChange={e => setNewLead(prev => ({ ...prev, value: e.target.value }))}
                                            placeholder="e.g. ₹50,000"
                                            className="h-14 bg-white/[0.04] border-white/10 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest">Lead Priority</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Hot', 'Warm', 'Cold'] as const).map(st => (
                                            <Button
                                                type="button"
                                                key={st}
                                                variant={newLead.status === st ? "primary" : "secondary"}
                                                onClick={() => setNewLead(prev => ({ ...prev, status: st }))}
                                                className="h-12 rounded-xl text-xs font-bold uppercase tracking-wider"
                                            >
                                                {st}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs mt-6"
                                >
                                    {submitting ? 'Creating...' : 'Save Connection'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
