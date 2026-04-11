import React from 'react';
import logo from "@/assets/OIP (1).webp"
import { motion } from 'framer-motion';
import {
    Layers, Zap, Users, BarChart3, ShieldCheck,
    ArrowRight, Check, Play, MessageSquare,
    Target, LineChart, Globe, Sparkles, TrendingUp,
    CreditCard, Instagram, Twitter, Linkedin, Youtube, Rocket, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

// Assets
import creatorImg from "@/assets/creator_visual.png";
import brandImg from "@/assets/brand_visual.png";
import heroVideo from "@/assets/istockphoto-2033341126-640_adpp_is.mp4";
import heroAvatar from "@/assets/hero_avatar.png";

const IMAGES = {
    CREATOR: creatorImg,
    BRAND: brandImg
};

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
    <section className={className} id={id}>
        <div className="max-w-7xl mx-auto px-8 md:px-12">
            {children}
        </div>
    </section>
);

export function LandingPage() {
    const [activeTab, setActiveTab] = React.useState<'creator' | 'brand'>('creator');

    return (
        <div className="min-h-screen bg-dark text-heaven-text overflow-hidden font-sans selection:bg-primary/30">
            {/* Background Effects: Heavenly Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full animate-pulse opacity-40" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[140px] rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }} />
                <div className="absolute top-[20%] left-[30%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full opacity-30" />
            </div>

            {/* Navigation: Glassmorphic Floating Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-dark/40 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-8 md:px-12 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-soft-glow relative overflow-hidden bg-button-gradient">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover relative z-10" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-heaven-text group-hover:text-primary transition-all duration-500 uppercase">CreatorsHQ</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em]">
                        {['Features', 'Creators', 'Brands', 'About', 'Pricing'].map(link => (
                            <a key={link} href={`#${link.toLowerCase()}`} className="hover:text-primary transition-all duration-300 relative group py-2">
                                {link}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-hover:w-full rounded-full shadow-soft-glow" />
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-[10px] font-bold text-heaven-muted hover:text-heaven-text uppercase tracking-[0.3em] transition-all">Log in</Link>
                        <Link to="/signup">
                            <Button variant="primary" className="h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-soft-glow hidden sm:flex">Entry</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 🔥 HERO SECTION: Elegant & Commanding */}
            <section className="relative pt-56 pb-40 z-10 overflow-hidden" id="hero">
                {/* Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
                >
                    <source src={heroVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-dark/90 via-transparent to-dark z-0 opacity-40" />

                <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="flex gap-4 mb-10">
                                <button 
                                    onClick={() => setActiveTab('creator')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all border",
                                        activeTab === 'creator' 
                                            ? "bg-primary/10 border-primary/40 text-primary shadow-soft-glow" 
                                            : "bg-white/[0.04] border-white/[0.08] text-heaven-muted hover:bg-white/[0.08]"
                                    )}
                                >
                                    Creator
                                </button>
                                <button 
                                    onClick={() => setActiveTab('brand')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all border",
                                        activeTab === 'brand' 
                                            ? "bg-secondary/10 border-secondary/40 text-secondary shadow-soft-glow" 
                                            : "bg-white/[0.04] border-white/[0.08] text-heaven-muted hover:bg-white/[0.08]"
                                    )}
                                >
                                    Brand
                                </button>
                            </div>

                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1] mb-10 text-heaven-text uppercase">
                                {activeTab === 'creator' ? (
                                    <>
                                        Your Creative <br className="hidden sm:block" />
                                        <span className="text-transparent bg-clip-text bg-button-gradient">Universe</span> <br className="hidden sm:block" />
                                        Unified.
                                    </>
                                ) : (
                                    <>
                                        Elite Brand <br className="hidden sm:block" />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Impact</span> <br className="hidden sm:block" />
                                        Realized.
                                    </>
                                )}
                            </h1>
                            <p className="text-lg md:text-2xl text-heaven-muted opacity-40 leading-relaxed max-w-2xl font-medium italic tracking-tight mb-14 px-4 sm:px-0">
                                {activeTab === 'creator' 
                                    ? "A high-performance operating system designed for the next generation of creative elite."
                                    : "Connect with world-class talent and execute high-performance campaigns with precision analytics."}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-center lg:justify-start">
                                <Link to="/signup" className="w-full sm:w-auto">
                                    <Button variant="primary" className="w-full sm:w-auto h-20 px-14 text-[11px] font-bold uppercase tracking-[0.4em] rounded-[2.25rem] shadow-soft-glow hover:scale-[1.02] transition-all">
                                        Begin Journey
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto h-20 px-12 text-[11px] font-bold uppercase tracking-[0.4em] rounded-[2.25rem] border-white/[0.08] bg-white/[0.02] text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04] transition-all opacity-60 hover:opacity-100 group"
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    <Play className="w-5 h-5 mr-4 fill-current transition-transform group-hover:scale-110" /> Vision Overview
                                </Button>
                            </div>
                        </motion.div>

                        {/* Hero Visual - Restored Scale & Quality */}
                        <div className="flex-1 relative hidden lg:block">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10 aspect-[4/5] rounded-[4rem] overflow-hidden border border-white/[0.08] shadow-glass group/avatar"
                            >
                                <motion.img
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1 }}
                                    src={activeTab === 'creator' ? heroAvatar : IMAGES.BRAND}
                                    alt="Elite Visual"
                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-all duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent opacity-60" />
                            </motion.div>

                            {/* Floating Interaction Nodes */}
                            <motion.div
                                animate={{ y: [0, 30, 0], x: [0, 10, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-12 -right-12 z-20 group-hover:scale-105 transition-transform duration-700"
                            >
                                <Card className="py-6 px-8 border-primary/20 bg-dark/60 backdrop-blur-3xl rounded-[2.5rem] shadow-soft-glow border">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">Operational Growth</div>
                                            <div className="text-xl font-bold text-heaven-text tracking-tighter">14.2% <CheckCircle2 className="inline w-3 h-3 ml-2 text-primary animate-pulse" /></div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, -30, 0], x: [0, -10, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                className="absolute -bottom-10 -left-12 z-20 group-hover:scale-105 transition-transform duration-700"
                            >
                                <Card className="py-6 px-8 border-secondary/20 bg-dark/60 backdrop-blur-3xl rounded-[2.5rem] shadow-glass border">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-center text-secondary group-hover:rotate-3 transition-transform">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">Talent Registry</div>
                                            <div className="text-xl font-bold text-heaven-text tracking-tighter uppercase whitespace-nowrap">Status: Hub Active</div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ⚡ FEATURES GRID: Clean & Spaced */}
            <Section className="py-20 sm:py-40 relative z-10 px-6 sm:px-0" id="features">
                <div className="text-center max-w-4xl mx-auto mb-20 sm:mb-28">
                    <Badge className="bg-primary/5 text-primary border-primary/20 mb-8 rounded-full h-10 px-6 uppercase font-bold tracking-[0.3em] backdrop-blur-xl">Core Hubs</Badge>
                    <h2 className="text-4xl md:text-7xl font-bold mb-8 md:mb-10 tracking-tighter uppercase leading-none">A Unified <br className="hidden md:block" /> Creative Engine</h2>
                    <p className="text-lg md:text-xl text-heaven-muted opacity-40 leading-loose max-w-2xl mx-auto font-medium italic tracking-tight">One calm interface to replace your fragmented workflow. Move with precision.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {[
                        { icon: Layers, title: "Central Hub", desc: "Your entire ecosystem synchronized in one professional workspace.", delay: 0.1 },
                        { icon: Target, title: "Market Lab", desc: "Strategic tools for brand partnerships and campaign management.", delay: 0.2 },
                        { icon: Users, title: "Talent Direct", desc: "Seamless networking and collaboration with top-tier creators.", delay: 0.3 },
                        { icon: BarChart3, title: "Insight Engine", desc: "Data-driven growth strategies powered by deep analytics.", delay: 0.4 },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: item.delay, duration: 0.8 }}
                        >
                            <Card className="p-10 group hover:bg-white/[0.06] transition-all duration-700 border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-[3.5rem] shadow-glass h-full flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div className="w-16 h-16 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center text-heaven-muted group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/10 transition-all duration-700 shadow-glass">
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-heaven-text uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-heaven-muted leading-relaxed text-sm font-medium italic tracking-tight opacity-40">{item.desc}</p>
                                </div>
                                <div className="mt-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-primary flex items-center gap-3 font-bold text-[10px] uppercase tracking-[0.2em] cursor-pointer">
                                    Explore Module <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* 📈 GROWTH: Visual Proof */}
            <Section className="py-40 bg-white/[0.01] overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/2 blur-[100px] pointer-events-none" />
                <div className="grid lg:grid-cols-2 gap-28 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <Badge className="bg-secondary/5 text-secondary border-secondary/20 mb-10 rounded-full h-10 px-8">Operational Excellence</Badge>
                        <h2 className="text-5xl md:text-7xl font-bold mb-10 tracking-tighter uppercase leading-none">Focus on <br /> <span className="text-secondary">Creation.</span></h2>
                        <p className="text-xl text-heaven-muted mb-14 leading-relaxed opacity-40 font-medium italic tracking-tight">We automate the administrative complexity so you can reclaim your creative energy.</p>

                        <div className="space-y-10">
                            {[
                                "AI-Powered Content Generation",
                                "Automated Audience Insights",
                                "Collaborative Marketplace Access",
                                "Strategic Campaign Management",
                                "Unified Revenue Ledger"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 group">
                                    <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-glass">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span className="text-lg font-bold text-heaven-muted group-hover:text-heaven-text transition-colors uppercase tracking-tight opacity-40 group-hover:opacity-100">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="relative group">
                        <div className="absolute -inset-10 bg-secondary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <Card className="p-4 border-white/[0.12] shadow-glass rounded-[4rem] group-hover:scale-[1.01] transition-transform duration-1000 relative z-10 overflow-hidden">
                            <div className="absolute inset-0 bg-dark/20 backdrop-blur-[2px]" />
                            <img src={IMAGES.BRAND || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80"} alt="Growth Visual" className="rounded-[3.5rem] w-full border border-white/[0.08] relative z-10" />
                        </Card>
                    </div>
                </div>
            </Section>

            {/* 💰 PRICING: Premium & Minimal */}
            <Section className="py-20 sm:py-48" id="pricing">
                <div className="text-center mb-32">
                    <Badge className="bg-white/[0.04] text-heaven-muted border-white/[0.08] mb-8 rounded-full h-10 px-8 uppercase tracking-[0.3em] font-bold">Investment</Badge>
                    <h2 className="text-5xl md:text-7xl font-bold mb-10 tracking-tighter uppercase leading-none">Elite Access Plans</h2>
                    <p className="text-xl text-heaven-muted opacity-40 font-medium italic">Scalable solutions for every stage of your creative evolution.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {[
                        { name: "Entry", price: "0", features: ["Insight Dashboard", "AI Generation (Basic)", "Unified Library"] },
                        { name: "Prime", price: "999", features: ["Everything in Entry", "Advanced Analytics", "AI Unlimited", "Marketplace Access"], popular: true },
                        { name: "Growth", price: "2999", features: ["Everything in Prime", "Global Directory", "Agency Tools", "Priority Support"] },
                        { name: "Enterprise", price: "Custom", features: ["Dedicated Account", "White-label Hub", "Full API Access", "Managed Campaigns"] },
                    ].map((plan, i) => (
                        <Card key={i} className={cn("p-12 flex flex-col items-center text-center group transition-all duration-700 rounded-[4rem] relative overflow-hidden",
                            plan.popular
                                ? "bg-primary/[0.02] border-primary/40 shadow-soft-glow border-2"
                                : "bg-white/[0.04] border-white/[0.08] shadow-glass hover:bg-white/[0.06]"
                        )}>
                            {plan.popular && (
                                <div className="absolute top-0 inset-x-0 h-1 bg-primary shadow-soft-glow animate-pulse" />
                            )}
                            <h3 className="text-2xl font-bold mb-6 text-heaven-text uppercase tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-12">
                                {plan.price === "Custom" ? (
                                    <span className="text-4xl font-bold uppercase tracking-tighter text-heaven-text">Contact</span>
                                ) : (
                                    <>
                                        <span className="text-xl font-bold text-heaven-muted/40">₹</span>
                                        <span className="text-6xl font-bold tracking-tighter text-heaven-text">{plan.price}</span>
                                        <span className="text-[10px] font-bold text-heaven-muted/40 uppercase tracking-widest mt-2">/mo</span>
                                    </>
                                )}
                            </div>
                            <ul className="space-y-6 mb-16 text-xs text-heaven-muted font-bold uppercase tracking-tight w-full text-left flex-1 opacity-60">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-4">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> <span className="opacity-80">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/signup" className="w-full">
                                <Button variant={plan.popular ? "primary" : "outline"} className="w-full h-16 uppercase font-bold tracking-[0.3em] text-[10px] rounded-[1.75rem] shadow-soft-glow transition-all">
                                    Activate Plan
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            </Section>

            {/* 🛡️ ABOUT SECTION: Core Vision */}
            <Section className="py-40 relative z-10" id="about">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <div className="relative group">
                        <div className="absolute -inset-10 bg-primary/10 blur-[80px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                        <Card className="p-8 border-white/[0.08] bg-white/[0.04] backdrop-blur-3xl rounded-[4rem] relative z-10 overflow-hidden">
                            <div className="space-y-8 p-10">
                                <Badge className="bg-primary/5 text-primary border-primary/20 mb-4 h-10 px-8">The Philosophy</Badge>
                                <h2 className="text-5xl font-black uppercase tracking-tighter text-heaven-text leading-none">Preserving Creative <br /> Integrity.</h2>
                                <p className="text-heaven-muted opacity-40 leading-relaxed font-medium italic text-lg tracking-tight">CreatorsHQ was founded on a singular principle: The administrative burden of success should never stifle the flame of original creation.</p>
                                <div className="grid grid-cols-2 gap-8 pt-10">
                                    <div>
                                        <div className="text-3xl font-black text-primary tracking-tighter mb-2">99%</div>
                                        <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">System Uptime</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-secondary tracking-tighter mb-2">Elite</div>
                                        <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.2em] opacity-40">Talent Only</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-12">
                        <h3 className="text-3xl font-bold uppercase tracking-tighter text-heaven-text">What is CreatorsHQ?</h3>
                        <p className="text-xl text-heaven-muted opacity-50 leading-loose italic tracking-tight font-medium">
                            We are a high-performance ecosystem that bridges the gap between raw creative potential and institutional brand excellence. Our unified interface replaces fragmented workflows with precision-engineered hubs for CRM, analytics, campaigns, and secure revenue management. 
                        </p>
                        <ul className="space-y-6">
                            {[
                                "A unified OS for modern creative elite",
                                "Zero-friction brand collaborations",
                                "High-fidelity strategic analytics",
                                "Secure, instantaneous revenue ledgers"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-6 group">
                                    <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-150 transition-transform shadow-soft-glow" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-heaven-muted group-hover:text-heaven-text transition-colors opacity-60 group-hover:opacity-100">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            {/* 🚀 FINAL CTA: Heavenly & Impactful */}
            <Section className="py-56 relative overflow-hidden">
                <div className="absolute inset-0 bg-button-gradient opacity-20 blur-[160px] pointer-events-none" />
                <Card className="relative overflow-hidden rounded-[5rem] bg-button-gradient p-28 text-center shadow-soft-glow border-none group">
                    <div className="absolute inset-0 bg-dark/20 backdrop-blur-[4px] group-hover:backdrop-blur-0 transition-all duration-1000" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -mr-[300px] -mt-[300px] animate-pulse" />
                    <div className="relative z-10 flex flex-col items-center">
                        <Badge className="bg-white/20 text-white border-white/30 mb-10 h-10 px-10 uppercase font-black tracking-[0.5em] backdrop-blur-xl">Initiate Access</Badge>
                        <h2 className="text-5xl md:text-8xl font-bold mb-12 leading-[0.95] tracking-tighter text-white uppercase">Your Creative <br /> Future Awaits.</h2>
                        <p className="text-2xl text-white/70 mb-16 max-w-2xl mx-auto font-medium italic tracking-tight opacity-80 leading-relaxed">Experience a new standard of creative management. calm, powerful, and professional.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <Link to="/signup">
                                <Button className="h-24 px-20 text-[13px] bg-button-gradient text-white rounded-[2.5rem] hover:scale-105 font-bold uppercase tracking-[0.4em] shadow-soft-glow active:scale-95 transition-all">Start Your Engine</Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="outline" className="h-24 px-16 text-[11px] border-white/20 text-white hover:bg-white/10 rounded-[2.5rem] font-bold uppercase tracking-[0.4em] backdrop-blur-xl transition-all">Discover Portal</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </Section>

            {/* 🔻 FOOTER: Minimal & Sophisticated */}
            <footer className="py-24 border-t border-white/[0.05] relative z-10 bg-dark/80 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-30">
                        <p>© 2026 CreatorsHQ. Preserving Creative Excellence.</p>
                        <p className="flex items-center gap-3">Designed with <Sparkles className="w-3.5 h-3.5 text-primary opacity-60" /> for the Elite</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
