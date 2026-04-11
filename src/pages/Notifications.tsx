import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Bell, CheckCheck, Clock, Shield,
    Zap, ShoppingBag, MessageSquare, AlertCircle,
    Server, Activity as ActivityIcon, ChevronRight, Archive, CheckCircle2
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";

export default function Notifications() {
    const { activities, markActivitiesRead } = useAppContext();
    const [filter, setFilter] = useState<'all' | 'campaign' | 'system' | 'message'>('all');

    const filteredActivities = activities.filter(a => filter === 'all' || a.type === filter);

    const getIcon = (type: string) => {
        switch (type) {
            case 'campaign': return <ShoppingBag className="w-6 h-6" />;
            case 'message': return <MessageSquare className="w-6 h-6" />;
            case 'billing': return <Zap className="w-6 h-6" />;
            case 'system': return <Server className="w-6 h-6" />;
            default: return <Bell className="w-6 h-6" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'campaign': return 'text-primary bg-primary/10 border-primary/20 shadow-soft-glow';
            case 'message': return 'text-secondary bg-secondary/10 border-secondary/20 shadow-soft-glow';
            case 'billing': return 'text-accent bg-accent/10 border-accent/20 shadow-soft-glow';
            case 'system': return 'text-primary bg-primary/10 border-primary/20 shadow-soft-glow';
            default: return 'text-heaven-muted/40 bg-white/5 border-white/10';
        }
    };

    const handleMarkRead = () => {
        markActivitiesRead();
        toast.success('All notifications marked as read');
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase flex items-center gap-8 cursor-default">
                        Recent Activity
                        <div className="flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-primary text-xl font-bold text-white shadow-soft-glow animate-pulse">
                            {activities.filter(a => !a.read).length}
                        </div>
                    </h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <ActivityIcon className="w-4 h-4 text-primary animate-pulse" />
                        System Monitoring Active
                    </p>
                </div>
                <Button
                    onClick={handleMarkRead}
                    variant="primary"
                    className="h-16 px-12 rounded-[2.25rem] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 shadow-soft-glow transition-all"
                >
                    <CheckCheck className="w-5 h-5 shadow-sm" />
                    Mark All Seen
                </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-center">
                {['all', 'campaign', 'message', 'system'].map((f) => (
                    <Button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "h-14 px-10 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all border shadow-glass",
                            filter === f ? 'bg-primary text-white border-primary/20 shadow-soft-glow' : 'bg-white/[0.04] text-heaven-muted border-white/[0.08] hover:bg-white/[0.08] hover:text-heaven-text'
                        )}
                    >
                        {f}
                    </Button>
                ))}
            </div>

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {filteredActivities.length > 0 ? (
                        filteredActivities.map((activity, idx) => (
                            <motion.div
                                key={activity.id}
                                layout
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Card className={cn(
                                    "p-10 border-white/[0.08] backdrop-blur-xl rounded-[3.5rem] flex items-center gap-10 group hover:border-white/[0.12] transition-all shadow-glass overflow-hidden relative",
                                    activity.read ? 'bg-white/[0.02] opacity-40 hover:opacity-60' : 'bg-white/[0.06] border-l-4 border-l-primary shadow-soft-glow'
                                )}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />

                                    <div className={cn(
                                        "w-18 h-18 rounded-[1.75rem] flex items-center justify-center shrink-0 shadow-glass border transition-all duration-700 group-hover:rotate-6 relative z-10",
                                        getColor(activity.type)
                                    )}>
                                        {getIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-heaven-muted opacity-40">
                                                {activity.type} update
                                            </p>
                                            <span className="text-[10px] font-bold text-heaven-muted/20 flex items-center gap-3 uppercase tracking-widest">
                                                <Clock className="w-4 h-4 opacity-40" />
                                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-xl font-bold tracking-tight uppercase transition-colors leading-tight",
                                            activity.read ? 'text-heaven-muted' : 'text-heaven-text'
                                        )}>
                                            {activity.message}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-all relative z-10 pr-6">
                                        <Button variant="secondary" className="h-14 w-14 p-0 rounded-2xl bg-white/[0.02] border-white/[0.08] text-heaven-muted hover:text-heaven-text">
                                            <ChevronRight className="w-7 h-7" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <Card className="text-center py-60 border-2 border-dashed border-white/[0.08] rounded-[5rem] bg-white/[0.02] flex flex-col items-center backdrop-blur-xl">
                            <div className="w-28 h-28 bg-white/[0.04] rounded-[3rem] shadow-glass border border-white/[0.08] flex items-center justify-center text-heaven-muted/10 mx-auto mb-10 opacity-20">
                                <Bell className="w-14 h-14" />
                            </div>
                            <h3 className="text-4xl font-bold text-heaven-text tracking-tight uppercase cursor-default">Archive Entry Void</h3>
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.5em] mt-6 leading-loose opacity-40 max-w-sm mx-auto">Your activity ledger is currently empty. Connect platforms to see real-time updates.</p>
                        </Card>
                    )}
                </AnimatePresence>
            </div>

            <Card className="p-16 border-none bg-gradient-to-br from-primary to-secondary text-white rounded-[5rem] shadow-soft-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-dark/20 backdrop-blur-[2px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-[250px] -mt-[250px] group-hover:scale-110 transition-transform duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 text-center md:text-left">
                        <h3 className="text-4xl font-bold tracking-tight uppercase leading-none flex items-center justify-center md:justify-start gap-6">
                           <Archive className="w-10 h-10 shadow-soft-glow" />
                           Activity Archiving
                        </h3>
                        <p className="text-white/70 font-bold text-[10px] uppercase tracking-widest leading-loose max-w-xl opacity-80">System automatically archives activity older than 30 days to maintain peak performance for your dashboard streams.</p>
                    </div>
                    <Button variant="glass" className="h-20 px-14 bg-white/10 backdrop-blur-xl text-white font-bold text-[10px] uppercase tracking-[0.4em] rounded-[2.5rem] hover:bg-white/20 transition-all border-white/20 shadow-glass">
                        Archive Settings
                    </Button>
                </div>
            </Card>
        </div>
    );
}
