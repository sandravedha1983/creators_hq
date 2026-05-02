import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Instagram, Youtube, Linkedin, Slack,
    Globe, Shield, Zap,
    RefreshCw, Copy, CheckCircle, XCircle
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from 'react-hot-toast';
import { Spinner } from "@/components/ui/Spinner";
import API from '@/services/api';

export default function Integrations() {
    const { integrations, toggleIntegration } = useAppContext();
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showInstagramModal, setShowInstagramModal] = useState(false);
    const [verificationStep, setVerificationStep] = useState(false);
    
    // State variables as requested
    const [verified, setVerified] = useState(false);
    const [code, setCode] = useState("");
    const [username, setUsername] = useState("");
    const [profileLink, setProfileLink] = useState("");

    const handleToggle = async (id: string, name: string, isConnected: boolean) => {
        if (name === 'Instagram' && !isConnected) {
            setShowInstagramModal(true);
            return;
        }

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

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Initiating Link...");
        
        try {
            // POST /api/integrations/instagram/link
            const res = await API.post('/api/integrations/instagram/link', { profileLink });
            
            if (res.data.success) {
                // DO NOT VERIFY ON LINK
                setVerified(false); 
                setCode(res.data.code);
                setUsername(res.data.username);
                setVerificationStep(true);
                toast.success("Profile Linked. Ownership verification required.", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to link profile", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        const toastId = toast.loading("Verifying Ownership...");
        
        try {
            // POST /api/integrations/instagram/verify
            const res = await API.post('/api/integrations/instagram/verify', {
                username,
                code
            });

            if (res.data.verified) {
                setVerified(true);
                toast.success("Verified ✅", { id: toastId });
                // Only close modal after real verification success
                setTimeout(() => {
                    setShowInstagramModal(false);
                    window.location.reload();
                }, 1500);
            } else {
                setVerified(false);
                toast.error("Code not found ❌", { id: toastId });
            }
        } catch (err: any) {
            setVerified(false);
            toast.error("Verification failed ❌", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        toast.success("Code copied!");
    };

    const getIcon = (name: string) => {
        switch (name) {
            case 'Instagram': return <Instagram className="w-6 h-6" />;
            case 'YouTube': return <Youtube className="w-6 h-6" />;
            case 'LinkedIn': return <Linkedin className="w-6 h-6" />;
            case 'Slack': return <Slack className="w-6 h-6" />;
            default: return <Globe className="w-6 h-6" />;
        }
    };

    if (loading && !showInstagramModal) return <Spinner />;

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {integrations.map((integration, idx) => (
                    <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                    >
                        <Card className={cn(
                            "p-10 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3rem] transition-all duration-700 group",
                            integration.connected ? "shadow-glass border-primary/20" : "opacity-50"
                        )}>
                            <div className="flex items-start justify-between mb-12">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700",
                                    integration.connected ? 'bg-primary/20 text-primary shadow-soft-glow' : 'bg-white/5 text-heaven-muted'
                                )}>
                                    {getIcon(integration.name)}
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                                    integration.connected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-white/5 text-heaven-muted/40'
                                )}>
                                    {integration.connected ? 'Connected' : 'Offline'}
                                </div>
                            </div>

                            <div className="space-y-2 mb-12">
                                <h3 className="text-2xl font-bold text-heaven-text tracking-tight">{integration.name}</h3>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-50">{integration.category}</p>
                            </div>

                            <Button
                                onClick={() => handleToggle(integration.id, integration.name, integration.connected)}
                                disabled={!!isSyncing}
                                variant={integration.connected ? "ghost" : "primary"}
                                className="w-full h-14 rounded-2xl font-bold text-[10px] uppercase tracking-widest"
                            >
                                {isSyncing === integration.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : (integration.connected ? 'Disconnect' : 'Connect')}
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showInstagramModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { if (!loading) { setShowInstagramModal(false); setVerificationStep(false); } }}
                            className="absolute inset-0 bg-dark/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-xl bg-[#0A0F1D] border border-white/[0.08] rounded-[3rem] p-12 shadow-glass relative z-10"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Instagram className="w-8 h-8" />
                                </div>
                                <button onClick={() => setShowInstagramModal(false)} className="text-heaven-muted/20 hover:text-white transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            {!verificationStep ? (
                                <>
                                    <h3 className="text-3xl font-bold text-white mb-2">Connect Instagram</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold mb-10 uppercase tracking-widest opacity-60">Step 1: Link Profile</p>
                                    <form onSubmit={handleManualSubmit} className="space-y-8">
                                        <div className="space-y-3">
                                            <label htmlFor="instagram" className="text-[10px] font-bold text-primary uppercase tracking-widest ml-2">Instagram Profile Link</label>
                                            <input
                                                id="instagram"
                                                name="instagram"
                                                type="url"
                                                placeholder="https://instagram.com/username"
                                                className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 text-sm font-medium focus:border-primary/50 outline-none text-white"
                                                value={profileLink}
                                                onChange={e => setProfileLink(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" variant="primary" disabled={loading} className="w-full h-18 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-soft-glow">
                                            Establish Link
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <div className="space-y-10">
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-bold text-white">Verify Ownership</h3>
                                        <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-widest opacity-60">Step 2: Add Code to Bio</p>
                                    </div>

                                    <div className="p-8 bg-white/[0.03] border border-dashed border-white/20 rounded-3xl space-y-6 text-center">
                                        <p className="text-heaven-muted text-xs leading-relaxed">
                                            Paste this unique code anywhere in your bio so we can verify you own <strong>@{username}</strong>.
                                        </p>
                                        <div className="flex items-center justify-center gap-4">
                                            <code className="text-2xl font-mono font-bold text-primary tracking-wider bg-primary/5 px-6 py-3 rounded-xl border border-primary/20">
                                                {code}
                                            </code>
                                            <button onClick={copyCode} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                <Copy className="w-5 h-5 text-heaven-muted" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Button 
                                            onClick={handleVerify} 
                                            variant="primary" 
                                            disabled={loading}
                                            className="w-full h-18 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-soft-glow"
                                        >
                                            {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                                            {verified ? "Verified ✅" : "Verify Ownership"}
                                        </Button>
                                        <p className="text-center text-[10px] text-heaven-muted font-bold uppercase tracking-widest opacity-40">
                                            Verification depends on real-time bio validation.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
