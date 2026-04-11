import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Send, Copy, RefreshCw, Wand2, MessageSquare, Lightbulb, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

export default function AIStudio() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [type, setType] = useState<'idea' | 'caption'>('idea');

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);

        // Simulate AI logic
        setTimeout(() => {
            const ideas = [
                "A 'day in the life' vlog focusing on the tools you use for CreatorsHQ.",
                "Top 5 tips for brands looking to collaborate with niche creators.",
                "Behind the scenes: How we built our latest campaign strategy.",
                "The evolution of SaaS UI: Why dark mode is the future of focus."
            ];
            const captions = [
                "🚀 Elevate your workflow with CreatorsHQ. The only OS for creators who mean business. #SaaS #CreatorEconomy",
                "Collaboration shouldn't be hard. Discover how we're bridging the gap between brands and talent. 🎯",
                "Data-driven, creator-focused. Welcome to the future of content management. ✨ #CreatorsHQ #Innovation",
                "Ready to scale? Our Neural Engine handles the boring stuff so you can focus on creating. 📈"
            ];

            const list = type === 'idea' ? ideas : captions;
            const random = list[Math.floor(Math.random() * list.length)];
            setResult(random);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight flex items-center gap-5">
                        AI Studio
                        <Sparkles className="w-10 h-10 text-primary animate-pulse shadow-soft-glow" />
                    </h1>
                    <p className="text-heaven-muted text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3 opacity-50">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        Next-Gen Creation Engine
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-12 p-12 border-white/[0.12] bg-dark-navy rounded-[4rem] space-y-12 shadow-glass relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                        <div className="flex p-2 bg-[#0B0F1A] rounded-[2.25rem] w-fit mx-auto border border-white/[0.12]">
                            <button
                                onClick={() => setType('idea')}
                                className={cn(
                                    "px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3",
                                    type === 'idea' ? 'bg-primary text-white shadow-soft-glow' : 'text-heaven-muted hover:text-heaven-text'
                                )}
                            >
                                <Lightbulb className="w-4 h-4" />
                                Content Ideas
                            </button>
                            <button
                                onClick={() => setType('caption')}
                                className={cn(
                                    "px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3",
                                    type === 'caption' ? 'bg-primary text-white shadow-soft-glow' : 'text-heaven-muted hover:text-heaven-text'
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Caption Assistant
                            </button>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={type === 'idea' ? "Describe your niche or audience focus..." : "What is the core message of your post?"}
                                className="w-full h-48 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.08] focus:border-primary/20 focus:bg-white/[0.04] outline-none transition-all duration-700 font-medium text-heaven-text resize-none text-lg placeholder:text-heaven-muted/20"
                            />
                            <div className="absolute bottom-8 right-8 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-heaven-muted uppercase tracking-widest opacity-30">
                                    {prompt.length} / 500
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            variant="primary"
                            size="lg"
                            className="w-full h-20 rounded-[2.5rem] shadow-soft-glow flex items-center justify-center gap-6 group"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    Generating insights...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                                    Generate Content
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:col-span-12"
                        >
                            <Card className="p-12 border-primary/20 bg-gradient-to-br from-primary/5 via-white/[0.02] to-white/[0.02] rounded-[3.5rem] shadow-glass relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10">
                                    <button
                                        className="p-5 bg-white/5 text-heaven-muted rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 border border-white/5 shadow-glass active:scale-95"
                                        onClick={() => {
                                            navigator.clipboard.writeText(result);
                                            toast.success('Copied to clipboard');
                                        }}
                                    >
                                        <Copy className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="max-w-4xl space-y-10">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] flex items-center gap-3">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                                        Generation Complete
                                    </p>
                                    <h2 className="text-3xl font-medium text-heaven-text leading-relaxed tracking-tight italic">
                                        "{result}"
                                    </h2>
                                    <div className="flex gap-6 pt-6">
                                        <Button variant="primary" className="rounded-2xl h-14 px-10">
                                            Save to Library
                                        </Button>
                                        <Button variant="ghost" className="rounded-2xl h-14 px-10 text-heaven-muted hover:text-heaven-text">
                                            Refresh Result
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
