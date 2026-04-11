import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Zap,
    Plus,
    Trash2,
    Settings,
    ArrowRight,
    Mail,
    Bell,
    Globe,
    Cpu,
    Workflow as WorkflowIcon,
    X,
    ChevronRight,
    Shield
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

export default function Automation() {
    const { rules, addRule } = useAppContext();
    const [isForgeOpen, setIsForgeOpen] = useState(false);
    const [newRule, setNewRule] = useState({ condition: 'New Lead Created', action: 'Send Welcome Email' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            addRule(newRule);
            setIsForgeOpen(false);
            setNewRule({ condition: 'New Lead Created', action: 'Send Welcome Email' });
            setIsSaving(false);
            toast.success('Automation rule active');
        }, 800);
    };

    return (
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight cursor-default">Workflows</h1>
                    <p className="text-heaven-muted text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3 opacity-60">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        Running Engines: <span className="text-primary font-bold ml-1">{rules.length} Active</span>
                    </p>
                </div>
                <Button
                    onClick={() => setIsForgeOpen(true)}
                    variant="primary"
                    className="flex items-center gap-4 h-16 px-10 rounded-[2.25rem] shadow-soft-glow"
                >
                    <Plus className="w-5 h-5" />
                    New Automation
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <Card className="p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4rem] min-h-[600px] flex flex-col shadow-glass relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-1000" />

                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center text-primary shadow-soft-glow">
                                    <WorkflowIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold text-heaven-text uppercase tracking-tight">Active Matrix</h3>
                            </div>
                            <div className="flex items-center gap-4 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Operational</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 relative z-10">
                            {rules.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-heaven-muted/10 py-40">
                                    <Cpu className="w-24 h-24 mb-8 opacity-20" />
                                    <p className="font-bold text-sm uppercase tracking-[0.5em]">No automation detected</p>
                                    <p className="text-[10px] mt-6 font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40 text-center max-w-xs">Start creating workflows to automate repetitive tasks and save time.</p>
                                </div>
                            ) : (
                                rules.map((rule, idx) => (
                                    <motion.div
                                        key={rule.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                                        className="p-8 bg-white/[0.02] border border-white/[0.08] rounded-[3rem] flex items-center justify-between group/rule hover:border-primary/20 transition-all duration-500 shadow-glass"
                                    >
                                        <div className="flex items-center gap-12 flex-1">
                                            <div className="flex flex-col items-center">
                                                <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-4 opacity-40">Trigger</div>
                                                <div className="px-8 py-4 bg-white/[0.04] rounded-2xl border border-white/[0.08] text-heaven-text font-bold text-[11px] tracking-widest uppercase shadow-glass">{rule.condition}</div>
                                            </div>
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20">
                                                <ArrowRight className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-4 opacity-40">Response</div>
                                                <div className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-[11px] tracking-widest uppercase shadow-soft-glow">{rule.action}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 ml-12">
                                            <button className="p-5 bg-white/[0.02] rounded-2xl text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04] transition-all border border-white/[0.08]"><Settings className="w-5 h-5" /></button>
                                            <button className="p-5 bg-accent/10 rounded-2xl text-accent/40 hover:text-accent hover:bg-accent/20 transition-all border border-accent/20"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-10">
                    <Card className="p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] shadow-glass group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <h3 className="text-xl font-bold text-heaven-text mb-10 flex items-center gap-5 relative z-10 uppercase tracking-tight">
                            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-soft-glow">
                                <Zap className="w-6 h-6" />
                            </div>
                            Smart Templates
                        </h3>
                        <div className="grid grid-cols-1 gap-5 relative z-10">
                            {[
                                { icon: Mail, label: 'Welcome Dispatch', count: '1,204 runs', color: 'text-primary' },
                                { icon: Globe, label: 'Cross-Sync Protocol', count: '852 runs', color: 'text-secondary' },
                                { icon: Bell, label: 'Priority Alerts', count: '43 runs', color: 'text-accent' },
                            ].map((t, i) => (
                                <button key={i} className="p-7 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] flex items-center justify-between group/item hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 text-left shadow-glass">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/[0.08] bg-white/[0.02]", t.color)}>
                                            <t.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-heaven-text uppercase tracking-widest">{t.label}</p>
                                            <p className="text-[10px] text-heaven-muted font-bold mt-2 uppercase tracking-[0.2em] opacity-40">{t.count}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-heaven-muted/10 group-hover/item:translate-x-1 group-hover/item:text-heaven-text transition-all" />
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-12 border-none bg-gradient-to-br from-primary to-secondary text-white rounded-[3.5rem] shadow-soft-glow relative overflow-hidden group">
                        <div className="absolute inset-0 bg-dark/20 backdrop-blur-[2px]" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-white shadow-glass">
                                <Shield className="w-7 h-7" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold tracking-tighter uppercase">Pro Automations</h3>
                                <p className="text-white/70 text-xs font-bold leading-relaxed uppercase tracking-widest leading-loose">Access multi-step workflows and advanced pattern detection for your network.</p>
                            </div>
                            <Button className="w-full h-18 bg-white text-primary font-bold text-[11px] uppercase tracking-[0.4em] rounded-[2rem] hover:shadow-2xl hover:scale-[1.02] transition-all border-0 shadow-xl">
                                Upgrade Plan
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <AnimatePresence>
                {isForgeOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsForgeOpen(false)}
                            className="absolute inset-0 bg-dark/60 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-2xl glass-heaven p-16 rounded-[4.5rem] overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-16 relative z-10">
                                <div>
                                    <h2 className="text-4xl font-bold text-heaven-text tracking-tight uppercase">New Workflow</h2>
                                    <p className="text-heaven-muted font-bold mt-3 uppercase text-[10px] tracking-[0.4em] flex items-center gap-3 opacity-60">
                                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                                        Protocol: Logic Initiation
                                    </p>
                                </div>
                                <button onClick={() => setIsForgeOpen(false)} className="p-5 bg-white/5 rounded-3xl text-heaven-muted hover:text-heaven-text transition-all border border-white/5">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-12 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-50">When this trigger activates</label>
                                    <select
                                        className="w-full h-16 glass-heaven border-white/10 rounded-3xl px-8 text-heaven-text font-bold uppercase text-[10px] tracking-widest appearance-none outline-none focus:border-primary/30 transition-all duration-500"
                                        value={newRule.condition}
                                        onChange={e => setNewRule({ ...newRule, condition: e.target.value })}
                                    >
                                        <option value="New Lead Created">Lead Registration</option>
                                        <option value="Post Published">Content Broadcast</option>
                                        <option value="Payment Failed">Payment Exception</option>
                                        <option value="Profile Updated">Identity Migration</option>
                                    </select>
                                </div>

                                <div className="flex justify-center -my-6 relative z-10">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-soft-glow border-4 border-dark">
                                        <ArrowRight className="w-7 h-7 rotate-90" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-50">Then execute this response</label>
                                    <select
                                        className="w-full h-16 glass-heaven border-white/10 rounded-3xl px-8 text-heaven-text font-bold uppercase text-[10px] tracking-widest appearance-none outline-none focus:border-primary/30 transition-all duration-500"
                                        value={newRule.action}
                                        onChange={e => setNewRule({ ...newRule, action: e.target.value })}
                                    >
                                        <option value="Send Welcome Email">Dispatch Welcome Email</option>
                                        <option value="Notify Slack">Send Slack Alert</option>
                                        <option value="Tag as High Value">Assign VIP Tag</option>
                                        <option value="Create Task">Create Follow-up Task</option>
                                    </select>
                                </div>

                                <Button 
                                    isLoading={isSaving}
                                    type="submit" 
                                    variant="primary" 
                                    className="w-full h-20 text-[10px] uppercase tracking-[0.5em] rounded-[2.5rem] shadow-soft-glow mt-8 hover:scale-[1.02] transition-transform"
                                >
                                    Activate Workflow
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
