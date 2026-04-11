import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Users, UserPlus, Mail, Shield,
    MoreHorizontal, Trash2, CheckCircle2,
    Clock, Briefcase, PlusCircle, UserCheck, Zap, Shield as ShieldIcon, X
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";

export default function Team() {
    const { team, inviteTeamMember } = useAppContext();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Editor');
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Email is required');
            return;
        }
        setIsInviting(true);
        setTimeout(() => {
            inviteTeamMember(email, role);
            setEmail('');
            setIsInviting(false);
            toast.success('Invitation dispatched');
        }, 800);
    };

    return (
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase flex items-center gap-8 cursor-default">
                        Team Hub
                        <div className="flex -space-x-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-dark bg-white/[0.04] backdrop-blur-xl flex items-center justify-center text-[10px] font-bold text-heaven-muted uppercase tracking-widest shadow-glass relative group-hover:scale-110 transition-transform cursor-pointer">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                    </h1>
                    <p className="text-heaven-muted text-xs font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <Users className="w-4 h-4 text-primary animate-pulse" />
                        Collaboration Engine Active
                    </p>
                </div>
                <div className="flex gap-4">
                    <Card className="px-10 py-6 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-glass flex items-center gap-6 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors duration-1000" />
                        <div className="text-right font-bold relative z-10">
                            <p className="text-[10px] text-heaven-muted uppercase tracking-[0.3em] mb-2 opacity-40">Active Seats</p>
                            <p className="text-2xl text-primary tracking-tighter">{team.filter(t => t.status === 'Active').length + 1} / 10</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-soft-glow relative z-10">
                            <UserCheck className="w-7 h-7" />
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                    <Card className="p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-glass rounded-[4rem] relative overflow-hidden group sticky top-32">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] -mr-40 -mt-40 group-hover:scale-110 transition-transform duration-1000" />

                        <div className="relative z-10 space-y-10">
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase flex items-center gap-5">
                                <UserPlus className="w-9 h-9 text-primary" />
                                Add Member
                            </h3>
                            <form onSubmit={handleInvite} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-heaven-muted ml-2 opacity-40">Project Email</label>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@youragency.com"
                                        className="h-16 rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-heaven-muted ml-2 opacity-40">Organizational Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full h-16 glass-heaven border-white/10 text-heaven-text rounded-2xl px-8 font-bold text-[10px] uppercase tracking-[0.2em] outline-none focus:border-primary/20 appearance-none cursor-pointer shadow-glass"
                                    >
                                        <option value="Editor">Visual Producer</option>
                                        <option value="Manager">Account Manager</option>
                                        <option value="Strategist">Creative Strategist</option>
                                        <option value="Admin">System Admin</option>
                                    </select>
                                </div>
                                <Button 
                                    isLoading={isInviting}
                                    type="submit" 
                                    variant="primary" 
                                    className="w-full h-20 rounded-[2rem] shadow-soft-glow mt-6 uppercase tracking-[0.4em] text-[10px]"
                                >
                                    Send Invite
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <AnimatePresence mode="popLayout">
                        {team.length > 0 ? (
                            team.map((member, idx) => (
                                <motion.div
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <Card className="p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] flex items-center justify-between group hover:border-white/[0.12] transition-all duration-500 shadow-glass overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />

                                        <div className="flex items-center gap-8 relative z-10">
                                            <div className={cn(
                                                "w-18 h-18 rounded-[1.5rem] flex items-center justify-center text-3xl font-bold shadow-glass border transition-transform group-hover:rotate-3",
                                                member.status === 'Invited' ? 'bg-white/[0.02] border-white/[0.08] text-heaven-muted opacity-40' : 'bg-primary/10 border-primary/20 text-primary'
                                            )}>
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-bold text-heaven-text tracking-tight uppercase leading-none">{member.name}</h4>
                                                <div className="flex items-center gap-6 mt-3 opacity-60">
                                                    <span className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] flex items-center gap-3">
                                                        <Mail className="w-3.5 h-3.5 opacity-40" />
                                                        {member.email}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
                                                        <ShieldIcon className="w-3.5 h-3.5" />
                                                        {member.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 relative z-10">
                                            <div className={cn(
                                                "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border transition-all",
                                                member.status === 'Invited'
                                                    ? 'bg-accent/10 border-accent/20 text-accent animate-pulse shadow-accent/10'
                                                    : 'bg-primary/10 border-primary/20 text-primary shadow-soft-glow'
                                            )}>
                                                {member.status === 'Invited' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {member.status}
                                            </div>
                                            <Button variant="secondary" className="h-14 w-14 p-0 rounded-2xl bg-white/[0.02] border-white/[0.08] text-heaven-muted opacity-0 group-hover:opacity-100 transition-all hover:text-accent">
                                                <Trash2 className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <Card className="py-52 border-2 border-dashed border-white/[0.08] rounded-[5rem] bg-white/[0.02] flex flex-col items-center text-center backdrop-blur-xl">
                                <div className="w-28 h-28 bg-white/[0.04] rounded-[3rem] shadow-glass border border-white/[0.08] flex items-center justify-center text-heaven-muted mb-12 opacity-20">
                                    <Users className="w-14 h-14" />
                                </div>
                                <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase cursor-default">Building your core</h3>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.5em] mt-6 max-w-sm mx-auto leading-loose opacity-40">Invite your first collaborator to start scaling your content engine across multiple channels.</p>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
