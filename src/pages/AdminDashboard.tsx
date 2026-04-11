import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Users, Database, Activity, Server, Activity as ActivityIcon, Search, Filter, Zap, Lock, Globe, Terminal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'system' | 'reports'>('system');
    const navigate = useNavigate();
    const { users } = useAppContext();

    const handleAudit = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Initializing system audit...',
                success: 'Audit report generated successfully',
                error: 'Audit failed to initialize',
            }
        );
    };

    return (
        <div className="space-y-16 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase cursor-default leading-none">Admin Control</h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <Lock className="w-4 h-4 text-primary animate-pulse" />
                        System Administrator Verified
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => navigate('/reports')}
                        variant="secondary"
                        className="h-16 px-10 rounded-[2.25rem] font-bold text-[10px] uppercase tracking-[0.3em] bg-white/[0.04] border-white/10 text-heaven-muted hover:text-heaven-text shadow-glass"
                    >
                        View Reports
                    </Button>
                    <Button
                        onClick={handleAudit}
                        variant="primary"
                        className="h-16 px-10 rounded-[2.25rem] gap-4 font-bold text-[10px] uppercase tracking-[0.3em] shadow-soft-glow hover:scale-[1.02] transition-all"
                    >
                        <ShieldCheck className="w-5 h-5 shadow-sm" />
                        Run System Audit
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                    { label: 'Active Sessions', value: users.length.toString(), progress: users.length > 0 ? 100 : 0, icon: Users, color: 'text-primary', bg: 'bg-primary/5 border-primary/10', bar: 'bg-primary shadow-soft-glow' },
                    { label: 'Global Uptime', value: '00.0%', progress: 0, icon: ActivityIcon, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10', bar: 'bg-secondary shadow-soft-glow' },
                    { label: 'Resource Load', value: '0.0%', progress: 0, icon: Database, color: 'text-accent', bg: 'bg-accent/5 border-accent/10', bar: 'bg-accent shadow-soft-glow' },
                ].map((stat, i) => (
                    <Card key={i} className="p-10 space-y-10 border-white/[0.08] bg-[#050810]/30 backdrop-blur-3xl rounded-[3.5rem] shadow-glass overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors duration-1000" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-8">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 border shadow-glass", stat.bg, stat.color)}>
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] text-heaven-muted font-bold uppercase tracking-[0.3em] leading-none opacity-40">{stat.label}</p>
                                    <h3 className="text-4xl font-bold text-heaven-text tracking-tighter leading-none">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/[0.05]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.progress}%` }}
                                    transition={{ duration: 1, delay: i * 0.2 }}
                                    className={cn("h-full rounded-full transition-all duration-700", stat.bar)}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-12">
                <div className="flex items-center gap-14 border-b border-white/[0.05]">
                    {[
                        { id: 'system', label: 'Health Status' },
                        { id: 'users', label: 'User Directory' },
                        { id: 'reports', label: 'Audit Archives' }
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
                            {activeTab === tab.id && <motion.div layoutId="admin-tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-soft-glow rounded-full" />}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'system' && (
                        <motion.div
                            key="system"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                        >
                            <Card className="p-16 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] shadow-glass relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                <div className="flex items-center gap-8 mb-12">
                                    <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-soft-glow relative z-10">
                                        <Server className="w-8 h-8" />
                                    </div>
                                    <div className="relative z-10 space-y-3">
                                        <h3 className="text-2xl font-bold text-heaven-text uppercase tracking-tight leading-none">Diagnostic Stream</h3>
                                        <p className="text-[10px] text-heaven-muted font-bold uppercase tracking-[0.3em] opacity-40">Connected system components</p>
                                    </div>
                                </div>
                                <div className="space-y-6 relative z-10">
                                    {users.length > 0 ? (
                                        users.slice(0, 4).map((u, i) => (
                                            <div key={i} className="p-8 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] flex items-center justify-between group/row hover:border-primary/20 transition-all duration-500 shadow-glass">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-soft-glow" />
                                                    <span className="font-bold text-[11px] text-heaven-text tracking-widest uppercase">{u.name}</span>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <span className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">{u.role}</span>
                                                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Verified</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-24 flex flex-col items-center justify-center space-y-8 opacity-10">
                                            <div className="w-20 h-20 bg-white/[0.02] border border-white/[0.08] rounded-[2rem] flex items-center justify-center shadow-glass">
                                                <Zap className="w-10 h-10" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.5em] ml-[0.5em]">No Output Detected</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-16 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] shadow-glass flex flex-col justify-center items-center text-center space-y-12 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <ActivityIcon className="w-28 h-28 text-heaven-muted/5 group-hover:text-primary/20 transition-all duration-1000 animate-pulse" />
                                <div className="space-y-6 relative z-10">
                                    <h3 className="text-3xl font-bold text-heaven-dark tracking-tight uppercase leading-none">Throughput Analysis</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.5em] leading-loose max-w-sm mx-auto opacity-60">System initialization required to baseline operational performance metrics. Diagnostic clusters are currently on standby.</p>
                                </div>
                                <Button variant="secondary" className="h-18 px-14 rounded-[2.25rem] bg-slate-50 border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] hover:text-primary transition-all">Initialize Diagnostic</Button>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Card className="p-24 bg-[#050810]/90 border border-dashed border-white/[0.08] rounded-[5rem] flex flex-col items-center text-center space-y-12 backdrop-blur-3xl shadow-glass">
                                <div className="w-32 h-32 bg-white/[0.02] rounded-[3.5rem] shadow-glass border border-white/[0.08] flex items-center justify-center relative group">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Users className="w-16 h-16 text-primary shadow-soft-glow relative z-10" />
                                </div>
                                <div className="space-y-6 max-w-md">
                                    <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase leading-none">User Identity Hub</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] leading-loose opacity-40">Centrally monitor all authenticated users, credentials, and security clearance levels within the network architecture.</p>
                                </div>
                                <Button onClick={() => navigate('/users')} variant="primary" className="h-20 px-20 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.5em] shadow-soft-glow hover:scale-[1.02] transition-all">
                                    Access Directory Hub
                                </Button>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'reports' && (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Card className="p-24 bg-[#050810]/90 border border-dashed border-white/[0.08] rounded-[5rem] flex flex-col items-center text-center space-y-12 backdrop-blur-3xl shadow-glass">
                                <div className="w-32 h-32 bg-white/[0.02] rounded-[3.5rem] shadow-glass border border-white/[0.08] flex items-center justify-center relative group">
                                    <div className="absolute inset-0 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Database className="w-16 h-16 text-accent shadow-soft-glow relative z-10" />
                                </div>
                                <div className="space-y-6 max-w-md">
                                    <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase leading-none">Audit Protocol Vault</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.5em] leading-loose opacity-40">Review system event sequences, archival data records, and administrative actions for compliance and oversight.</p>
                                </div>
                                <Button onClick={() => navigate('/reports')} variant="secondary" className="h-20 px-20 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.5em] shadow-glass bg-accent text-white border-none hover:bg-accent/80 hover:scale-[1.02] transition-all">
                                    Open Audit Vault
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
