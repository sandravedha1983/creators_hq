import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    User as UserIcon, Mail, Shield,
    ChevronRight, Camera, Cpu, Fingerprint,
    Instagram, Youtube, Linkedin, MapPin, Target,
    Save, RefreshCw, Star, ShieldCheck, Globe, Twitter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { getCreatorProfile, updateCreatorProfile, getBrandProfile, updateBrandProfile } from '@/services/profileService';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCreator = user?.role === 'creator';
    const isBrand = user?.role === 'brand';

    // Creator form
    const [creatorForm, setCreatorForm] = useState({
        username: '', bio: '', niche: '', location: '', website: '', goals: '',
        socialLinks: { instagram: '', youtube: '', twitter: '', linkedin: '', tiktok: '' }
    });

    // Brand form
    const [brandForm, setBrandForm] = useState({
        companyName: '', website: '', industry: '', location: '', description: '', objectives: '', budget: ''
    });

    // Common
    const [name, setName] = useState(user?.name || '');

    // ── Load existing profile on mount ────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                if (isCreator) {
                    const res = await getCreatorProfile();
                    if (res.data) {
                        const p = res.data;
                        setCreatorForm({
                            username: p.username || '',
                            bio: p.bio || '',
                            niche: p.niche || '',
                            location: p.location || '',
                            website: p.website || '',
                            goals: p.goals || '',
                            socialLinks: {
                                instagram: p.socialLinks?.instagram || '',
                                youtube: p.socialLinks?.youtube || '',
                                twitter: p.socialLinks?.twitter || '',
                                linkedin: p.socialLinks?.linkedin || '',
                                tiktok: p.socialLinks?.tiktok || ''
                            }
                        });
                        if (p.avatar) setPreviewUrl(p.avatar);
                    }
                } else if (isBrand) {
                    const res = await getBrandProfile();
                    if (res.data) {
                        const p = res.data;
                        setBrandForm({
                            companyName: p.companyName || '',
                            website: p.website || '',
                            industry: p.industry || '',
                            location: p.location || '',
                            description: p.description || '',
                            objectives: p.objectives || '',
                            budget: p.budget || ''
                        });
                        if (p.logo) setPreviewUrl(p.logo);
                    }
                }
            } catch (err) {
                console.error('[Profile] Load failed', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [isCreator, isBrand]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('Synchronizing profile...');
        try {
            if (isCreator) {
                await updateCreatorProfile({
                    ...creatorForm,
                    avatar: previewUrl || ''
                });
            } else if (isBrand) {
                await updateBrandProfile({
                    ...brandForm,
                    logo: previewUrl || ''
                });
            }
            // Also persist name/avatar to User model
            await updateProfile({ name, avatar: previewUrl || undefined });
            toast.success('Profile synchronized successfully', { id: toastId });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save profile', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

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
                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-2 opacity-50">Account Type</p>
                        <p className="text-xl font-bold text-primary tracking-tight uppercase">{user?.role || 'Creator'}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow relative z-10">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ── Avatar card ─────────────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-12">
                    <Card className="p-12 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[4rem] flex flex-col items-center text-center relative overflow-hidden group shadow-glass">
                        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div className="relative mt-8 mb-10 z-10">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <div className="w-36 h-36 bg-gradient-to-br from-primary via-secondary to-accent rounded-[3.5rem] p-[2px] shadow-soft-glow group-hover:rotate-3 transition-transform duration-700">
                                <div className="w-full h-full rounded-[3.4rem] bg-dark flex items-center justify-center overflow-hidden border-4 border-dark">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <span className="text-4xl font-bold text-heaven-text uppercase opacity-40">{name?.[0] || user?.name?.[0] || 'U'}</span>
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
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight uppercase leading-none mb-4">{name || user?.name || 'Anonymous'}</h3>
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] opacity-40">{user?.email}</p>
                        </div>
                        {isCreator && (
                            <div className="w-full p-8 bg-white/[0.02] rounded-[3rem] border border-white/[0.05] text-left relative z-10 group-hover:border-primary/20 transition-all duration-700">
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-4 opacity-30">Bio</p>
                                <textarea
                                    value={creatorForm.bio}
                                    onChange={e => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                                    placeholder="Describe your creative vision..."
                                    className="w-full bg-transparent border-0 text-xs font-medium text-heaven-text/60 focus:ring-0 resize-none h-24 outline-none placeholder:text-heaven-muted/20 leading-relaxed"
                                />
                            </div>
                        )}
                        {isBrand && (
                            <div className="w-full p-8 bg-white/[0.02] rounded-[3rem] border border-white/[0.05] text-left relative z-10">
                                <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-4 opacity-30">About</p>
                                <textarea
                                    value={brandForm.description}
                                    onChange={e => setBrandForm({ ...brandForm, description: e.target.value })}
                                    placeholder="Describe your brand..."
                                    className="w-full bg-transparent border-0 text-xs font-medium text-heaven-text/60 focus:ring-0 resize-none h-24 outline-none placeholder:text-heaven-muted/20 leading-relaxed"
                                />
                            </div>
                        )}
                    </Card>

                    {/* Social links (creator only) */}
                    {isCreator && (
                        <Card className="p-10 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] shadow-glass relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                            <h4 className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] mb-10 ml-2 opacity-40 relative z-10 text-center">Social Link Registry</h4>
                            <div className="space-y-6 relative z-10">
                                {[
                                    { icon: Instagram, key: 'instagram', label: 'Instagram', color: 'text-pink-400' },
                                    { icon: Youtube, key: 'youtube', label: 'YouTube', color: 'text-red-400' },
                                    { icon: Twitter, key: 'twitter', label: 'Twitter / X', color: 'text-sky-400' },
                                    { icon: Linkedin, key: 'linkedin', label: 'LinkedIn', color: 'text-blue-400' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center gap-4">
                                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.08] bg-white/[0.02]', item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <Input
                                            value={creatorForm.socialLinks[item.key as keyof typeof creatorForm.socialLinks]}
                                            onChange={e => setCreatorForm({ ...creatorForm, socialLinks: { ...creatorForm.socialLinks, [item.key]: e.target.value } })}
                                            placeholder={`https://${item.key}.com/yourhandle`}
                                            className="h-12 border-white/[0.08] bg-white/[0.02] rounded-2xl text-[10px] font-bold text-heaven-text tracking-widest placeholder:text-heaven-muted/10 focus:border-primary/30"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* ── Main form ────────────────────────────────────────────── */}
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
                            {/* Common */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Display Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-[0.2em] uppercase" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Email (Locked)</label>
                                <Input value={user?.email || ''} disabled className="h-16 bg-white/[0.01] border-white/[0.02] rounded-[1.5rem] text-heaven-muted/20 font-bold text-[11px] tracking-[0.2em] cursor-not-allowed uppercase" />
                            </div>

                            {/* Creator fields */}
                            {isCreator && (
                                <>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Niche / Domain</label>
                                        <Input value={creatorForm.niche} onChange={e => setCreatorForm({ ...creatorForm, niche: e.target.value })} placeholder="e.g. Lifestyle, Tech, Fashion" className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40" />
                                            <Input value={creatorForm.location} onChange={e => setCreatorForm({ ...creatorForm, location: e.target.value })} placeholder="e.g. Mumbai, India" className="h-16 pl-14 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40" />
                                            <Input value={creatorForm.website} onChange={e => setCreatorForm({ ...creatorForm, website: e.target.value })} placeholder="https://yoursite.com" className="h-16 pl-14 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Goals</label>
                                        <Input value={creatorForm.goals} onChange={e => setCreatorForm({ ...creatorForm, goals: e.target.value })} placeholder="e.g. Brand deals, 100K followers" className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                </>
                            )}

                            {/* Brand fields */}
                            {isBrand && (
                                <>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Company Name</label>
                                        <Input value={brandForm.companyName} onChange={e => setBrandForm({ ...brandForm, companyName: e.target.value })} className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Industry</label>
                                        <Input value={brandForm.industry} onChange={e => setBrandForm({ ...brandForm, industry: e.target.value })} placeholder="e.g. Fashion, Tech" className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40" />
                                            <Input value={brandForm.location} onChange={e => setBrandForm({ ...brandForm, location: e.target.value })} placeholder="e.g. Delhi, India" className="h-16 pl-14 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Monthly Budget</label>
                                        <Input value={brandForm.budget} onChange={e => setBrandForm({ ...brandForm, budget: e.target.value })} placeholder="e.g. ₹50,000 - ₹2,00,000" className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] ml-2 opacity-40">Campaign Objectives</label>
                                        <Input value={brandForm.objectives} onChange={e => setBrandForm({ ...brandForm, objectives: e.target.value })} placeholder="e.g. Brand awareness, product launches" className="h-16 bg-white/[0.02] border-white/[0.08] rounded-[1.5rem] focus:border-primary/30 text-heaven-text font-bold text-[11px] tracking-widest uppercase" />
                                    </div>
                                </>
                            )}

                            <div className="md:col-span-2 pt-14 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-heaven-muted/20">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-heaven-muted/40 leading-loose max-w-xs">Profile data is encrypted and synchronized<br />across your entire CreatorsHQ dashboard.</p>
                                </div>
                                <Button type="submit" variant="primary" className="h-20 px-16 shadow-soft-glow rounded-[2.25rem] hover:scale-[1.02] transition-all" disabled={isSaving}>
                                    <span className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.4em]">
                                        {isSaving ? <><RefreshCw className="w-5 h-5 animate-spin" /> Synchronizing...</> : <><Save className="w-5 h-5" /> Commit Changes</>}
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
                                    <h4 className="text-2xl font-bold tracking-tight uppercase leading-none">
                                        {user?.plan === 'pro' ? 'Pro Membership Active' : 'Free Plan'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-60">
                                        {user?.plan === 'pro' ? 'Unlimited AI generations & premium features' : '5 AI generations/month · Upgrade for unlimited access'}
                                    </p>
                                </div>
                            </div>
                            {user?.plan !== 'pro' && (
                                <Button variant="glass" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] text-heaven-text hover:bg-white/[0.08] font-bold text-[10px] uppercase tracking-[0.4em] px-10 h-14 shadow-glass">
                                    Upgrade to Pro
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
}
