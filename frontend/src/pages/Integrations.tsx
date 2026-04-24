import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Instagram, Youtube, Linkedin, Slack,
    Music2, Globe, Shield, Zap,
    CheckCircle2, XCircle, RefreshCw, Layers
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from 'react-hot-toast';

export default function Integrations() {
    const { integrations, toggleIntegration } = useAppContext();
    const [isSyncing, setIsSyncing] = useState<string | null>(null);

    const handleToggle = async (id: string, name: string, isConnected: boolean) => {
        setIsSyncing(id);
        
        try {
            await toggleIntegration(id);
            toast.success(`${name} ${isConnected ? 'Disconnected' : 'Connected Successfully'}`);
        } catch (error) {
            console.error(`Failed to link ${name}:`, error);
            toast.error(`Failed to link ${name}. Check your connection.`);
        } finally {
            setIsSyncing(null);
        }
    };

    const getIcon = (name: string) => {
        switch (name) {
            case 'Instagram': return <Instagram className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
            case 'YouTube': return <Youtube className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
            case 'TikTok': return <Music2 className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
            case 'LinkedIn': return <Linkedin className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
            case 'Slack': return <Slack className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
            default: return <Globe className="w-6 h-6 hover:scale-110 transition-transform duration-500" />;
        }
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight">App Directory</h1>
                    <p className="text-heaven-muted text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3 opacity-60">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        Connected Ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-8 px-10 py-6 rounded-[2.5rem] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-glass">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Active Links</p>
                        <p className="text-2xl font-bold text-primary">{integrations.filter(i => i.connected).length} / {integrations.length}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow">
                        <Layers className="w-7 h-7" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {integrations.map((integration, idx) => (
                    <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card className={cn(
                            "p-10 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3rem] transition-all duration-700 group hover:scale-[1.02]",
                            integration.connected ? "shadow-glass" : "opacity-50 grayscale-[0.5]"
                        )}>
                            <div className="flex items-start justify-between mb-12">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-soft-glow",
                                    integration.connected ? 'bg-button-gradient text-white shadow-soft-glow' : 'bg-white/5 text-heaven-muted'
                                )}>
                                    {getIcon(integration.name)}
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-700",
                                    integration.connected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-heaven-muted/40'
                                )}>
                                    {integration.connected ? 'Connected' : 'Disconnected'}
                                </div>
                            </div>

                            <div className="space-y-2 mb-12">
                                <h3 className="text-2xl font-bold text-heaven-text tracking-tight">{integration.name}</h3>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-50">{integration.category}</p>
                            </div>

                            <div className="pt-10 border-t border-white/[0.05] flex items-center justify-between">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-30">Status Link</p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={cn("w-1.5 h-3 rounded-full transition-colors duration-700", 
                                                integration.connected ? 'bg-primary shadow-soft-glow' : 'bg-white/5'
                                            )} />
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleToggle(integration.id, integration.name, integration.connected)}
                                    disabled={!!isSyncing}
                                    variant={integration.connected ? "ghost" : "primary"}
                                    className={cn(
                                        "h-14 px-8 rounded-2xl font-bold text-[10px] uppercase tracking-widest",
                                        integration.connected ? "text-accent hover:bg-accent/5" : "flex-1"
                                    )}
                                >
                                    {isSyncing === integration.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        integration.connected ? 'Disconnect' : 'Connect Account'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card className="p-12 bg-white/[0.02] rounded-[4rem] text-heaven-text overflow-hidden relative border border-white/[0.08] shadow-glass group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-80 -mt-80 group-hover:bg-primary/10 transition-colors duration-1000" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="max-w-xl space-y-6 text-center md:text-left">
                        <h3 className="text-3xl font-bold tracking-tight flex items-center gap-6 justify-center md:justify-start">
                            <Shield className="w-10 h-10 text-primary shadow-soft-glow" />
                            Premium Security
                        </h3>
                        <p className="text-heaven-muted font-medium leading-relaxed text-sm opacity-60">
                            Your platform connections are protected by end-to-end encryption. CreatorsHQ ensures your data remains private and secure across all synchronized environments.
                        </p>
                    </div>
                    <Button variant="outline" className="h-16 px-12 rounded-[2.5rem] font-bold text-[10px] uppercase tracking-[0.3em] hover:scale-105 transition-all">
                        Security Overview
                    </Button>
                </div>
            </Card>
        </div>
    );
}
