import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Send, Copy, RefreshCw, Zap, Brain, Rocket, MessageSquare, Lock, Crown, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import API from '@/services/api';
import { getAiUsage } from '@/services/profileService';

interface UsageData {
  used: number;
  limit: number | null;
  isPro: boolean;
  limitReached: boolean;
}

export default function AIStudio() {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState<'caption' | 'ideas' | 'script' | 'pitch' | 'hashtags' | 'email'>('caption');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [usageLoading, setUsageLoading] = useState(true);

    // Chat state
    const [chatMessage, setChatMessage] = useState('');
    const [chatReply, setChatReply] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState(false);

    // Load usage on mount
    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAiUsage();
                setUsage(res.data);
            } catch (err) {
                console.error('[AIStudio] Failed to load usage', err);
            } finally {
                setUsageLoading(false);
            }
        };
        load();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) { toast.error('Please enter a concept for the AI to process.'); return; }
        if (usage?.limitReached) { toast.error('Monthly limit reached. Upgrade to Pro for unlimited access.'); return; }

        setIsLoading(true);
        try {
            const res = await API.post('/api/ai/content', { prompt, type });
            if (res.data.success) {
                setResult(res.data.data);
                toast.success('Intelligence generated successfully.');
                // Refresh usage counter
                const usageRes = await getAiUsage();
                setUsage(usageRes.data);
            }
        } catch (err: any) {
            if (err.response?.status === 402 || err.response?.data?.limitReached) {
                setUsage(prev => prev ? { ...prev, limitReached: true } : prev);
                toast.error('Monthly limit reached. Upgrade to Pro for unlimited access.');
            } else {
                toast.error('Failed to generate content.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChat = async () => {
        if (!chatMessage.trim()) { toast.error('Please enter a message.'); return; }
        setChatLoading(true);
        try {
            const res = await API.post('/api/ai/chat', { message: chatMessage });
            if (res.data.success) setChatReply(res.data.reply);
        } catch { toast.error('Failed to get response from Growth Assistant.'); }
        finally { setChatLoading(false); }
    };

    const contentTypes = [
        { id: 'caption', label: 'Viral Captions', icon: MessageSquare, desc: 'Platform-ready captions' },
        { id: 'ideas', label: 'Post Concepts', icon: Zap, desc: 'Content idea bundles' },
        { id: 'script', label: 'Video Script', icon: TrendingUp, desc: 'Hook + body + CTA' },
        { id: 'pitch', label: 'Brand Pitch', icon: Rocket, desc: 'Collab outreach copy' },
        { id: 'hashtags', label: 'Hashtag Set', icon: Sparkles, desc: 'Optimised tag clusters' },
        { id: 'email', label: 'Outreach Email', icon: Send, desc: 'Professional email drafts' },
    ] as const;

    const usedPct = usage && usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

    return (
        <div className="space-y-12 animate-fade-in pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase italic leading-none">AI Studio</h1>
                    <p className="text-heaven-muted font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-4 opacity-50">
                        <Brain className="w-4 h-4 text-primary animate-pulse" />
                        Neural Content Architecture & Strategy
                    </p>
                </div>

                {/* Usage meter */}
                {!usageLoading && usage && (
                    <div className="flex items-center gap-6 px-8 py-5 rounded-[2rem] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-glass">
                        {usage.isPro ? (
                            <div className="flex items-center gap-4">
                                <Crown className="w-6 h-6 text-yellow-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Pro Plan</p>
                                    <p className="text-lg font-bold text-heaven-text">Unlimited</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 w-40">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50">Monthly Usage</p>
                                    <p className={`text-[10px] font-bold uppercase ${usage.limitReached ? 'text-red-400' : 'text-primary'}`}>
                                        {usage.used}/{usage.limit}
                                    </p>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${usage.limitReached ? 'bg-red-500' : 'bg-primary shadow-soft-glow'}`}
                                        style={{ width: `${usedPct}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Limit reached banner */}
            <AnimatePresence>
                {usage?.limitReached && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className="p-10 border-red-500/20 bg-red-500/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                    <Lock className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-heaven-text uppercase tracking-tight">Free Limit Reached</h3>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-50 mt-1">
                                        You've used all 5 free generations this month. Upgrade to Pro for unlimited access.
                                    </p>
                                </div>
                            </div>
                            <Button variant="primary" className="h-14 px-10 rounded-2xl font-bold uppercase tracking-widest shadow-soft-glow whitespace-nowrap">
                                <Crown className="w-5 h-5 mr-3" /> Upgrade to Pro
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Content type selector */}
                <div className="lg:col-span-1 space-y-4">
                    {contentTypes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id as any)}
                            className={`w-full p-6 rounded-[2rem] border transition-all flex items-center gap-4 text-left group ${
                                type === t.id
                                    ? 'bg-primary/10 border-primary/30 text-white shadow-soft-glow'
                                    : 'bg-black/40 border-white/[0.05] text-heaven-muted hover:border-white/10'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${type === t.id ? 'bg-primary text-white shadow-soft-glow' : 'bg-white/5'}`}>
                                <t.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.desc}</p>
                                <h4 className="font-bold text-sm uppercase tracking-tight">{t.label}</h4>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Generator */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-10 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3rem] shadow-glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-2 opacity-50">
                                    Describe your content concept
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. A day in the life of a software engineer in Bangalore — for Instagram Reels"
                                    className="w-full h-40 p-6 rounded-[2rem] bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder:text-white/10 text-sm font-medium"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-16 rounded-[1.5rem] font-bold uppercase tracking-[0.3em] shadow-soft-glow"
                                disabled={isLoading || usage?.limitReached}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : usage?.limitReached ? (
                                    <><Lock className="w-5 h-5 mr-3" /> Limit Reached</>
                                ) : (
                                    <><Sparkles className="w-5 h-5 mr-3" /> Generate</>
                                )}
                            </Button>
                        </form>
                    </Card>

                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Card className="p-10 border-primary/20 bg-primary/5 rounded-[3rem] relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Generated Output</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => setResult(null)} className="p-3 bg-white/5 rounded-xl text-heaven-muted hover:text-white transition-all border border-white/5">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied to clipboard.'); }} className="p-3 bg-white/5 rounded-xl text-heaven-muted hover:text-white transition-all border border-white/5">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed font-medium whitespace-pre-line">"{result}"</p>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="p-10 border-white/[0.08] bg-white/[0.02] rounded-[3rem] flex flex-col items-center justify-center min-h-[200px] text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-heaven-muted opacity-20">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <p className="text-[10px] text-heaven-muted uppercase tracking-widest opacity-40">Awaiting content parameters...</p>
                            </Card>
                        )}
                    </AnimatePresence>

                    {/* Growth Assistant Chat */}
                    <Card className="p-10 border-white/[0.08] bg-white/[0.02] rounded-[3rem] space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-tight">Crea — Growth Assistant</h3>
                                <p className="text-[9px] font-bold text-heaven-muted uppercase tracking-widest opacity-40">Ask anything about content strategy</p>
                            </div>
                        </div>
                        {chatReply && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-primary/5 border border-primary/15 rounded-2xl">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest opacity-60">AI Response</p>
                                    <button onClick={() => { navigator.clipboard.writeText(chatReply); toast.success('Copied.'); }} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <Copy className="w-3 h-3 text-heaven-muted" />
                                    </button>
                                </div>
                                <p className="text-white/85 text-sm leading-relaxed font-medium whitespace-pre-line">{chatReply}</p>
                            </motion.div>
                        )}
                        <div className="flex gap-4">
                            <Input
                                placeholder="Ask about growth, hooks, algorithms..."
                                className="h-14 rounded-2xl bg-black/40 border-white/10"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                                disabled={chatLoading}
                            />
                            <Button variant="primary" className="h-14 px-8 rounded-2xl" onClick={handleChat} disabled={chatLoading}>
                                {chatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
