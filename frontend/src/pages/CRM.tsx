import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Users,
    Plus,
    Search,
    Filter,
    MoreVertical,
    X,
    ArrowUpRight,
    Zap,
    Cpu
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export default function CRM() {
    const { leads, addLead } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', email: '', status: 'Hot' as const, value: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLead(newLead);
        setIsModalOpen(false);
        setNewLead({ name: '', email: '', status: 'Hot', value: '' });
    };

    return (
        <div className="animate-fade-in pb-20 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-bold text-heaven-text tracking-tight">Creator Directory</h1>
                    <div className="text-heaven-muted text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        {leads.length} Active Connections
                    </div>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="primary"
                    className="flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" />
                    New Connection
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heaven-muted group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search creators..."
                        className="pl-14 h-14 bg-white/[0.04] border-white/5 focus:bg-white/[0.06] focus:border-primary/20"
                    />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="flex items-center gap-3 h-14 px-8">
                        <Filter className="w-4 h-4 text-primary" />
                        Status
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Value</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em]">Created</th>
                                <th className="px-10 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24">
                                        <div className="flex flex-col items-center justify-center text-heaven-muted/20 space-y-6">
                                            <div className="w-20 h-20 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-inner">
                                                <Users className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-1 text-center">
                                                <p className="font-bold text-heaven-muted text-lg tracking-tight">No Creators Yet</p>
                                                <p className="text-xs font-medium opacity-50">Your directory is currently empty.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="group hover:bg-white/[0.02] transition-all duration-500">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-button-gradient p-[1px]">
                                                    <div className="w-full h-full rounded-[15px] bg-dark flex items-center justify-center text-white font-bold text-lg">
                                                        {lead.name[0]}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-heaven-text group-hover:text-primary transition-colors cursor-pointer tracking-tight">{lead.name}</p>
                                                    <p className="text-[10px] text-heaven-muted mt-1 font-bold uppercase tracking-widest">{lead.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full",
                                                    lead.status === 'Hot' ? 'bg-accent shadow-soft-glow' :
                                                        lead.status === 'Warm' ? 'bg-secondary shadow-soft-glow' :
                                                            'bg-heaven-muted/20'
                                                )} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                                                    lead.status === 'Hot' ? 'text-accent' :
                                                        lead.status === 'Warm' ? 'text-secondary' :
                                                            'text-heaven-muted/40'
                                                )}>
                                                    {lead.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-bold text-heaven-text tracking-widest">{lead.value}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-[10px] font-bold text-heaven-muted tracking-widest uppercase">{lead.date}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="p-3 text-heaven-muted hover:text-heaven-text transition-colors duration-500">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-dark/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-xl glass-heaven p-12 rounded-[3.5rem]"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-3xl font-bold text-heaven-text tracking-tight">Add New Connection</h2>
                                    <p className="text-heaven-muted font-bold mt-2 uppercase text-[10px] tracking-widest opacity-60">Create a new creator profile</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/5 rounded-2xl text-heaven-muted hover:text-heaven-text transition-all border border-white/5">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest ml-1">Creator Name</label>
                                    <Input
                                        required
                                        placeholder="Full name"
                                        value={newLead.name}
                                        onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest ml-1">Email Address</label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="hello@creator.com"
                                        value={newLead.email}
                                        onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest ml-1">Potential Value</label>
                                        <Input
                                            placeholder="$0.00"
                                            value={newLead.value}
                                            onChange={e => setNewLead({ ...newLead, value: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest ml-1">Priority Level</label>
                                        <select
                                            className="w-full h-14 glass-heaven rounded-2xl px-6 text-heaven-text font-bold uppercase text-xs focus:border-primary/20 appearance-none outline-none"
                                            value={newLead.status}
                                            onChange={e => setNewLead({ ...newLead, status: e.target.value as any })}
                                        >
                                            <option value="Hot">High Priority</option>
                                            <option value="Warm">Medium Priority</option>
                                            <option value="Cold">Low Priority</option>
                                        </select>
                                    </div>
                                </div>
                                <Button variant="primary" size="lg" className="w-full h-16 rounded-[2rem]">
                                    Complete Sync
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
