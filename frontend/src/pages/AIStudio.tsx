import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Send, Copy, RefreshCw, Zap, Brain, Rocket, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import API from '@/services/api';

export default function AIStudio() {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState<'caption' | 'ideas' | 'suggestions'>('caption');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            toast.error("Please enter a concept for the AI to process.");
            return;
        }

        setIsLoading(true);
        try {
            const endpoint = type === 'suggestions' ? '/api/ai/suggestions' : '/api/ai/content';
            const payload = type === 'suggestions' ? { profileData: { concept: prompt } } : { prompt, type };
            
            const res = await API.post(endpoint, payload);
            if (res.data.success) {
                setResult(res.data.data);
                toast.success("Intelligence generated successfully.");
            }
        } catch (err) {
            toast.error("Failed to establish neural uplink.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            toast.success("Copied to synaptic clipboard.");
        }
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-12 animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="space-y-4 mb-12">
                <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase italic leading-none">AI Studio</h1>
                <p className="text-heaven-muted font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-4 opacity-50">
                    <Brain className="w-4 h-4 text-primary animate-pulse" />
                    Neural Content Architecture & Strategy
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    {['caption', 'ideas', 'suggestions'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t as any)}
                            className={`w-full p-6 rounded-[2rem] border transition-all flex items-center gap-4 text-left group ${
                                type === t 
                                ? 'bg-primary/10 border-primary/30 text-white shadow-soft-glow' 
                                : 'bg-black/40 border-white/[0.05] text-heaven-muted hover:border-white/10'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                type === t ? 'bg-primary text-white shadow-soft-glow' : 'bg-white/5'
                            }`}>
                                {t === 'caption' && <MessageSquare className="w-6 h-6" />}
                                {t === 'ideas' && <Zap className="w-6 h-6" />}
                                {t === 'suggestions' && <Rocket className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{t}</p>
                                <h4 className="font-bold text-sm uppercase tracking-tight">
                                    {t === 'caption' && 'Viral Captions'}
                                    {t === 'ideas' && 'Post Concepts'}
                                    {t === 'suggestions' && 'Growth Strategy'}
                                </h4>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-10 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3rem] shadow-glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-2 opacity-50">
                                    {type === 'suggestions' ? 'What is your current niche or goal?' : 'Describe your content concept'}
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={type === 'suggestions' ? "e.g. Fitness creator looking to scale on YouTube" : "e.g. A vlog about a day in the life of a software engineer in Bangalore"}
                                    className="w-full h-40 p-6 rounded-[2rem] bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder:text-white/10 text-sm font-medium"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="w-full h-16 rounded-[1.5rem] font-bold uppercase tracking-[0.3em] shadow-soft-glow"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-3" />
                                        Establish Neural Uplink
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>

                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="p-10 border-primary/20 bg-primary/5 rounded-[3rem] relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Generated Intelligence</h4>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setResult(null)}
                                                className="p-3 bg-white/5 rounded-xl text-heaven-muted hover:text-white transition-all border border-white/5"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={copyToClipboard}
                                                className="p-3 bg-white/5 rounded-xl text-heaven-muted hover:text-white transition-all border border-white/5"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed font-medium italic">
                                        "{result}"
                                    </p>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="p-10 border-white/[0.08] bg-white/[0.02] rounded-[3rem] flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-heaven-muted opacity-20">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-heaven-text/60">Neural Uplink Idle</p>
                                    <p className="text-[10px] text-heaven-muted uppercase tracking-widest opacity-40">Awaiting content parameters...</p>
                                </div>
                            </Card>
                        )}
                    </AnimatePresence>

                    {/* AI Chat Support Section */}
                    <Card className="p-10 border-white/[0.08] bg-white/[0.02] rounded-[3rem] space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold uppercase tracking-tight">Growth Assistant</h3>
                        </div>
                        <div className="flex gap-4">
                            <Input 
                                placeholder="Ask about growth strategies..." 
                                className="h-14 rounded-2xl bg-black/40 border-white/10"
                            />
                            <Button variant="primary" className="h-14 px-8 rounded-2xl">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
