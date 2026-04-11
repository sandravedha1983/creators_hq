import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import API from '@/services/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const AiAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your CreatorsHQ AI. How can I assist your growth today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await API.post('/api/ai/chat', { message: userMessage });
            if (response.data.success) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please check your system logs." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-6 w-[400px] h-[600px] relative"
                    >
                        <Card className="h-full flex flex-col bg-[#050810]/95 border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] shadow-glass overflow-hidden">
                            {/* Header */}
                            <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-heaven-text uppercase tracking-widest">Neural AI</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-bold text-heaven-muted uppercase tracking-widest opacity-40">System Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-heaven-muted/40 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Chat Window */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                                {chatHistory.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex flex-col max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-5 rounded-3xl text-xs leading-relaxed font-medium shadow-glass",
                                            msg.role === 'user' 
                                                ? "bg-primary text-white rounded-br-none" 
                                                : "bg-white/[0.03] text-heaven-text border border-white/[0.05] rounded-bl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-heaven-muted mt-2 opacity-30">
                                            {msg.role === 'user' ? 'Direct Input' : 'Core Logic'}
                                        </span>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-3 text-primary ml-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest animate-pulse">Processing...</span>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-6 bg-black/40 border-t border-white/[0.05]">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Transmit message..."
                                        className="w-full bg-dark-navy border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-[11px] text-white focus:border-primary/50 outline-none transition-all placeholder:text-heaven-muted/30"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!message.trim() || isLoading}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-20"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-soft-glow border border-primary/20 hover:shadow-primary/30 transition-all duration-500"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};
