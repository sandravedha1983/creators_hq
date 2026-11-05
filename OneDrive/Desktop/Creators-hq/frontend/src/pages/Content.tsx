import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    FileText,
    Plus,
    Share2,
    X,
    Layers,
    Zap,
    Shield
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

export default function Content() {
    const { content, addContent } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', platform: 'YouTube', type: 'Video', status: 'Draft' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                addContent(newPost);
                setIsModalOpen(false);
                setNewPost({ title: '', platform: 'YouTube', type: 'Video', status: 'Draft' });
                setIsCreating(false);
                resolve(true);
            }, 1500);
        });

        toast.promise(promise, {
            loading: 'Creating new content...',
            success: 'Content created successfully',
            error: 'Failed to create content.',
        });
    };

    return (
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight cursor-default">Content Manager</h1>
                    <div className="text-heaven-muted text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3 opacity-60">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        Total Pieces: <span className="text-primary font-bold ml-1">{content.length} Published / Drafts</span>
                    </div>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="primary"
                    className="flex items-center gap-4 h-16 px-10 rounded-[2.25rem]"
                >
                    <Plus className="w-5 h-5" />
                    New Content
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <AnimatePresence>
                    {content.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                            <Card className="p-20 max-w-2xl w-full flex flex-col items-center space-y-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-3xl rounded-[5rem] shadow-glass relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000" />
                                <div className="w-28 h-28 bg-white/[0.02] border border-white/[0.08] rounded-[3rem] flex items-center justify-center shadow-glass relative z-10">
                                    <FileText className="w-14 h-14 text-heaven-muted/10 group-hover:text-primary transition-all duration-700 group-hover:scale-110" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <h3 className="text-3xl font-bold text-heaven-text tracking-tight">Library Empty</h3>
                                    <p className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.4em] max-w-sm mx-auto leading-loose opacity-40">Start creating your content legacy. Your first piece of content will appear here once created.</p>
                                </div>
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    variant="primary"
                                    className="h-18 px-14 rounded-[2.5rem] relative z-10"
                                >
                                    Get Started
                                </Button>
                            </Card>
                        </div>
                    ) : (
                        content.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Card className="p-12 group hover:scale-[1.02] transition-all duration-700 border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl rounded-[3.5rem] shadow-glass relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />

                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center text-heaven-muted group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-soft-glow">
                                                <Layers className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all duration-500">{item.platform}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] shadow-soft-glow">
                                            {item.status}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-heaven-text mb-6 leading-tight tracking-tight group-hover:text-primary transition-all duration-500 cursor-pointer relative z-10">{item.title}</h3>
                                    <p className="text-[10px] text-heaven-muted/30 mb-10 font-bold uppercase tracking-[0.4em] leading-none relative z-10 flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-primary/20 group-hover:text-primary transition-colors duration-500" />
                                        ID: {item.id.slice(0, 12).toUpperCase()}
                                    </p>

                                    <div className="flex items-center justify-between pt-10 border-t border-white/[0.05] relative z-10">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-heaven-muted/20 uppercase tracking-widest backdrop-blur-md">
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-heaven-muted hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all duration-500">
                                            <Share2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
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
                                    <h2 className="text-4xl font-bold text-heaven-text tracking-tight">Create Content</h2>
                                    <p className="text-heaven-muted font-bold mt-3 uppercase text-[10px] tracking-[0.4em] flex items-center gap-3 opacity-60">
                                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                                        Start a new content piece
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-5 bg-white/5 rounded-3xl text-heaven-muted hover:text-heaven-text transition-all border border-white/5">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-50">Content Title</label>
                                    <Input
                                        required
                                        placeholder="Enter your title..."
                                        value={newPost.title}
                                        onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-50">Platform</label>
                                        <select
                                            className="w-full h-16 glass-heaven border-white/5 rounded-3xl px-8 text-heaven-text font-bold uppercase text-[10px] tracking-widest appearance-none outline-none focus:border-primary/20 transition-all duration-500"
                                            value={newPost.platform}
                                            onChange={e => setNewPost({ ...newPost, platform: e.target.value })}
                                        >
                                            <option value="YouTube">YouTube</option>
                                            <option value="Twitter">Twitter / X</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Newsletter">Newsletter</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-50">Content Type</label>
                                        <select
                                            className="w-full h-16 glass-heaven border-white/5 rounded-3xl px-8 text-heaven-text font-bold uppercase text-[10px] tracking-widest appearance-none outline-none focus:border-primary/20 transition-all duration-500"
                                            value={newPost.type}
                                            onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                        >
                                            <option value="Video">Video</option>
                                            <option value="Thread">Thread</option>
                                            <option value="Post">Standard Post</option>
                                            <option value="Article">Long Article</option>
                                        </select>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg"
                                    className="w-full h-20 rounded-[2.5rem] mt-6 shadow-soft-glow"
                                    isLoading={isCreating}
                                >
                                    Create Content
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
