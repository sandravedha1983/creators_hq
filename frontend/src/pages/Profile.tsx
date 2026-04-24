import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    User as UserIcon, Mail, Shield, Bell, Globe, Zap,
    ChevronRight, Camera, Check, Cpu, Fingerprint,
    Instagram, Youtube, Linkedin, MapPin, Target,
    Save, RefreshCw, Star, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        niche: user?.niche || '',
        bio: user?.bio || '',
        location: user?.location || '',
        socials: {
            instagram: user?.socials?.instagram || '',
            youtube: user?.socials?.youtube || '',
            linkedin: user?.socials?.linkedin || ''
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                updateProfile({
                    ...form,
                    avatar: previewUrl || undefined
                });
                setIsSaving(false);
                resolve(true);
            }, 1200);
        });

        toast.promise(promise, {
            loading: 'Saving profile changes...',
            success: 'Profile updated successfully',
            error: 'Failed to update profile.',
        });
    };

    return (
        <div className="animate-fade-in pb-20 space-y-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase cursor-default">Profile Status</h1>
                    <div className="text-heaven-muted text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        Account Security: Optimal
                    </div>
                </div>
                <div className="flex items-center gap-6 px-10 py-6 rounded-[2.5rem] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-glass relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors duration-1000" />
                    <div className="text-right relative z-10">
                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-2 opacity-50">Signal Strength</p>
                        <p className="text-xl font-bold text-primary tracking-tight uppercase">Synchronized</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow relative z-10">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-12">
                    <Card className="p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4rem] flex flex-col items-center text-center relative overflow-hidden group shadow-glass">
                        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                        <div className="relative mt-8 mb-10 z-10">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <div className="w-36 h-36 bg-gradient-to-br from-primary via-secondary to-accent rounded-[3.5rem] p-[2px] shadow-soft-glow group-hover:rotate-3 transition-transform duration-700">
                                <div className="w-full h-full rounded-[3.4rem] bg-dark flex items-center justify-center overflow-hidden border-4 border-dark">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <span className="text-4xl font-bold text-heaven-text uppercase opacity-40">{form.name?.[0] || 'U'}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-3 -right-3 p-5 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[1.5rem] text-primary hover:scale-110 active:scale-95 transition-all shadow-glass"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative z-10 mb-10">
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase leading-none mb-4">{form.name || 'Anonymous User'}</h3>
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">{form.email || 'user@creatorshq.io'}</p>
                        </div>

                        <div className="w-full p-8 bg-white/[0.02] rounded-[3rem] border border-white/[0.05] text-left relative z-10 group-hover:border-primary/20 transition-all duration-700">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-4 opacity-30">Account Essence</p>
                            <textarea
                                value={form.bio}
                                onChange={e => setForm({ ...form, bio: e.target.value })}
                                placeholder="Describe your creative vision..."
                                className="w-full bg-transparent border-0 text-xs font-medium text-heaven-text/60 focus:ring-0 resize-none h-24 outline-none placeholder:text-heaven-muted/20 leading-relaxed"
                            />
                        </div>
                    </Card>

                    <Card className="p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] shadow-glass relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <h4 className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] mb-10 ml-2 opacity-40 relative z-10 text-center">Social Link Registry</h4>
                        <div className="space-y-6 relative z-10">
                            {[
                                { 
                                    icon: Instagram, 
                                    key: 'instagram', 
                                    label: 'Instagram', 
                                    color: 'text-primary',
                                    isConnected: user?.instagram?.isConnected,
                                    username: user?.instagram?.username,
                                    link: user?.instagram?.profileLink
                                },
                                { icon: Youtube, key: 'youtube', label: 'YouTube', color: 'text-secondary' },
                                { icon: Linkedin, key: 'linkedin', label: 'LinkedIn', color: 'text-accent' },
                            ].map((item: any) => (
                                <div key={item.key} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4 group/social">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.08] bg-white/[0.02] transition-all group-hover/social:bg-white/[0.05]", item.color)}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        {item.isConnected ? (
                                            <div className="flex-1 flex flex-col justify-center">
                                                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">CONNECTED</p>
                                                <a 
                                                    href={item.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-[11px] font-bold text-heaven-text hover:text-primary transition-all"
                                                >
                                                    @{item.username}
                                                </a>
                                            </div>
                                        ) : (
                                            <Input
                                                value={form.socials[item.key as keyof typeof form.socials]}
                                                onChange={e => setForm({
                                                    ...form,
                                                    socials: { ...form.socials, [item.key]: e.target.value }
                                                })}
                                                placeholder={`@username`}
                                                className="h-14 border-white/[0.08] bg-white/[0.02] rounded-2xl text-[10px] font-bold text-heaven-text uppercase tracking-widest placeholder:text-heaven-muted/10 focus:border-primary/30"
                                            />
                                        )}
                                    </div>
                                    {item.key === 'instagram' && !item.isConnected && (
                                        <p className="text-[8px] font-bold text-heaven-muted uppercase tracking-[0.3em] ml-20 opacity-30 italic">Link via Integrations Directory</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-12">
                    <Card className="p-14 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4.5rem] shadow-glass relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
                        
                        <div className="flex items-center gap-8 mb-16 relative z-10">
                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow">
                                <Fingerprint className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase">Registry Details</h3>
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mt-2 opacity-50">Global identification across the network</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Public Identifier</label>
                                <Input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="h-18 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-[0.2em] uppercase"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Operational Domain</label>
                                <Input
                                    value={form.niche}
                                    onChange={e => setForm({ ...form, niche: e.target.value })}
                                    placeholder="e.g. LIFESTYLE MODEL"
                                    className="h-18 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-[0.2em] uppercase"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Geographic Node</label>
                                <div className="relative">
                                    <MapPin className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40" />
                                    <Input
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                        placeholder="e.g. DUBAI, UAE"
                                        className="h-18 pl-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-[0.2em] uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Encrypted Email (LOCKED)</label>
                                <Input
                                    value={form.email}
                                    disabled
                                    className="h-18 bg-white/[0.01] border-white/[0.02] rounded-[1.5rem] text-heaven-muted/20 font-bold text-[11px] tracking-[0.2em] cursor-not-allowed uppercase"
                                />
                            </div>

                            <div className="md:col-span-2 pt-14 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex items-center gap-6 group/info">
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-heaven-muted/20 group-hover/info:text-primary transition-colors duration-500">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-heaven-muted/40 leading-loose max-w-xs">Data synchronization preserves <br />your status indicator across all hubs.</p>
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="h-20 px-16 shadow-soft-glow rounded-[2.25rem] hover:scale-[1.02] transition-all"
                                    disabled={isSaving}
                                >
                                    <span className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.4em]">
                                        {isSaving ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Synchronizing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Commit Changes
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-white/[0.08] shadow-glass rounded-[4rem] text-heaven-text relative overflow-hidden group">
                        <div className="absolute inset-0 bg-dark/20 backdrop-blur-[2px]" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-primary shadow-glass border border-white/20">
                                    <Star className="w-8 h-8 fill-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-4 leading-none">
                                        Pro Membership Status
                                    </h4>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-60">Priority Engine Access Active</p>
                                </div>
                            </div>
                            <Button 
                                variant="glass" 
                                onClick={() => toast.success("Priority Registry Access is Active")}
                                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] text-heaven-text hover:bg-white/[0.08] font-bold text-[10px] uppercase tracking-[0.4em] px-10 h-14 shadow-glass"
                            >
                                Registry: Prime
                            </Button>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
}
