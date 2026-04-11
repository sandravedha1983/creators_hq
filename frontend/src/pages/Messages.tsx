import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile, MessageSquare, Plus, Zap } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: string;
}

interface Conversation {
    id: string;
    name: string;
    initials: string;
    lastMessage: string;
    time: string;
    unread?: number;
    role: string;
    status: 'online' | 'offline';
}

export default function Messages() {
    // Initializing with empty state as requested
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim() || !selectedId) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => ({
            ...prev,
            [selectedId]: [...(prev[selectedId] || []), newMessage]
        }));
        setInputText('');
    };

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="h-[calc(100vh-180px)] flex gap-10 animate-fade-in relative z-10 max-w-7xl mx-auto">
            {/* Conversations List */}
            <Card className="w-[450px] flex flex-col overflow-hidden relative border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3.5rem] shadow-glass">
                <div className="p-10 border-b border-white/[0.05] space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-heaven-text tracking-tight uppercase">Messages</h2>
                        <Button variant="primary" className="w-12 h-12 p-0 rounded-2xl shadow-soft-glow">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heaven-muted group-focus-within:text-primary transition-all opacity-40" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-14 h-14 bg-black/40 border-white/[0.08] rounded-2xl text-[10px] uppercase font-bold tracking-widest placeholder:text-heaven-muted/20"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col items-center justify-center text-center">
                    {conversations.length > 0 ? (
                        conversations.map((conv) => (
                          <button
                              key={conv.id}
                              onClick={() => setSelectedId(conv.id)}
                              className={cn(
                                  "w-full p-6 rounded-[2.5rem] flex items-center gap-6 text-left transition-all group relative border border-transparent",
                                  selectedId === conv.id
                                      ? 'bg-white/[0.06] border-white/[0.1] shadow-glass'
                                      : 'hover:bg-white/[0.02] text-heaven-muted'
                              )}
                          >
                              <div className="relative">
                                  <div className={cn(
                                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-bold text-xl transition-all duration-500 shadow-glass border",
                                      selectedId === conv.id ? 'bg-primary text-white border-primary/20 shadow-soft-glow' : 'bg-white/[0.05] border-white/[0.08] text-heaven-muted/40'
                                  )}>
                                      {conv.initials}
                                  </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                      <p className="font-bold text-heaven-text truncate text-sm uppercase tracking-tight">{conv.name}</p>
                                      <span className="text-[9px] font-bold text-heaven-muted/20 uppercase tracking-widest">{conv.time}</span>
                                  </div>
                                  <p className="text-xs text-heaven-muted truncate opacity-40">{conv.lastMessage}</p>
                              </div>
                          </button>
                        ))
                    ) : (
                        <div className="space-y-6 opacity-40">
                            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto shadow-glass">
                                <Zap className="w-6 h-6 text-heaven-muted/20" />
                            </div>
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] max-w-[200px]">No active connections established.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Chat Window */}
            <Card className="flex-1 flex flex-col overflow-hidden relative border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3.5rem] shadow-glass">
                {selectedId && selectedConv ? (
                    <>
                        <div className="p-10 border-b border-white/[0.05] flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-18 h-18 bg-primary/10 text-primary border border-primary/20 rounded-[1.5rem] flex items-center justify-center font-bold text-2xl">
                                    {selectedConv.initials}
                                </div>
                                <div>
                                    <h3 className="font-bold text-2xl text-heaven-text tracking-tight uppercase leading-none mb-3">{selectedConv.name}</h3>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">{selectedConv.status === 'online' ? 'Active Status' : 'Offline'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="secondary" className="w-14 h-14 p-0 rounded-2xl bg-white/[0.02] border-white/[0.1] text-heaven-muted hover:text-heaven-text"><Phone className="w-6 h-6" /></Button>
                                <Button variant="secondary" className="w-14 h-14 p-0 rounded-2xl bg-white/[0.02] border-white/[0.1] text-heaven-muted hover:text-heaven-text"><Video className="w-6 h-6" /></Button>
                                <Button variant="secondary" className="w-14 h-14 p-0 rounded-2xl bg-white/[0.02] border-white/[0.1] text-heaven-muted hover:text-heaven-text"><MoreVertical className="w-6 h-6" /></Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-10 flex flex-col">
                            {(messages[selectedId] || []).map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id || idx}
                                    className={cn(
                                        "max-w-[70%] flex flex-col gap-3",
                                        msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'
                                    )}
                                >
                                    <div className={cn(
                                        "px-8 py-5 rounded-[2rem] text-sm font-medium leading-relaxed border shadow-glass",
                                        msg.sender === 'me' ? 'bg-primary text-white border-primary/20 rounded-tr-none' : 'bg-white/[0.04] text-heaven-text border-white/[0.08] rounded-tl-none'
                                    )}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] font-bold text-heaven-muted/20 uppercase tracking-[0.2em] px-3">{msg.timestamp}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-10 border-t border-white/[0.05]">
                            <div className="flex items-center gap-6 bg-black/20 border border-white/[0.08] rounded-[2.5rem] p-3 pl-8 shadow-glass">
                                <button className="p-2 text-heaven-muted/40 hover:text-primary transition-colors"><Paperclip className="w-5 h-5" /></button>
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-heaven-text placeholder:text-heaven-muted/10"
                                />
                                <Button onClick={handleSend} className="h-14 w-14 rounded-2xl shadow-soft-glow"><Send className="w-5 h-5" /></Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-10">
                        <div className="w-28 h-28 bg-white/[0.02] rounded-[3.5rem] flex items-center justify-center text-heaven-muted/10 border border-white/[0.08] shadow-glass">
                            <MessageSquare className="w-12 h-12" />
                        </div>
                        <div className="max-w-xs mx-auto space-y-4">
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase">Secure Inbox</h3>
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40 leading-loose">Communicate securely across the CreatorsHQ ecosystem. Select a connection to begin.</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
