import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { filterVisiblePlans, MEMBERSHIP_UI_ENABLED } from '@/config/planVisibility';
import { Navigate } from 'react-router-dom';

export default function Billing() {
    const { user } = useAuth();
    const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (!MEMBERSHIP_UI_ENABLED) return;
        API.get('/api/billing/history')
            .then(res => setTransactions(res.data?.data || []))
            .catch(() => setTransactions([]));
    }, []);

    if (!MEMBERSHIP_UI_ENABLED) {
        return <Navigate to="/" replace />;
    }

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setIsBetaModalOpen(true);
    };

    const handleActivateBeta = () => {
        toast.success(`You are already enjoying full V1 Beta access with unlimited features! 🎉`);
        setIsBetaModalOpen(false);
    };

    const plans = filterVisiblePlans([
        {
            name: 'Essence',
            price: '₹0',
            tag: 'Free Forever',
            desc: 'Foundational creator toolkit',
            features: ['Social Metrics & Profile Verification', 'AI Content Studio (5 runs/mo)', 'Community Discovery Listing', 'Basic Collaboration Pipeline'],
            current: user?.plan === 'free'
        },
        {
            name: 'Radiance Pro',
            price: '₹999',
            tag: 'Beta Unlocked',
            desc: 'High-performance growth engine',
            features: ['Unlimited AI Content Studio Generations', 'Automated Growth Score Diagnostics', 'Full CRM Leads Pipeline & Deal Tracking', 'Direct Brand Campaign Applications', 'Priority Verification Badge'],
            popular: true,
            current: true // In V1 Beta, all users get Pro access
        },
        {
            name: 'Celestial Agency',
            price: '₹2999',
            tag: 'Enterprise V2',
            desc: 'Enterprise-grade scale & teams',
            features: ['Dedicated Account Specialist', 'Custom Branded Domain', 'Multi-member Creator Rosters', 'SLA Guaranteed Support'],
            upcoming: true
        },
        {
            name: 'Elite',
            price: '₹4999',
            tag: 'VIP Access',
            desc: 'Reserved for premium members',
            features: ['Dedicated strategist', 'Sponsor introductions', 'Priority campaign access'],
            upcoming: true
        },
    ]);

    return (
        <div className="animate-fade-in pb-20 space-y-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-heaven-text tracking-tight uppercase cursor-default">Billing & Membership</h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-soft-glow" />
                        V1 Beta Access Tier: Active & Unlocked
                    </div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>All Beta Testers Enjoy Pro Tier Benefits</span>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                {plans.map((plan, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full"
                    >
                        <Card className={cn(
                            "p-10 flex flex-col h-full rounded-[4rem] relative overflow-hidden transition-all duration-700 hover:scale-[1.02]",
                            plan.popular && "border-primary/40 ring-1 ring-primary/20 shadow-primary/10 bg-white/[0.05]"
                        )}>
                            {plan.popular && (
                                <div className="absolute top-10 right-10 bg-primary/20 border border-primary/40 text-primary text-[9px] font-bold px-5 py-2 rounded-full uppercase tracking-widest shadow-soft-glow">
                                    CURRENT BETA TIER
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-heaven-text tracking-tight uppercase mb-2">{plan.name}</h3>
                                <p className="text-[10px] font-black text-heaven-muted uppercase tracking-widest opacity-60">{plan.desc}</p>
                            </div>

                            <div className="mb-10 flex items-baseline gap-2 relative z-10">
                                <span className="text-5xl font-black text-heaven-text tracking-tight">{plan.price}</span>
                                <span className="font-bold text-heaven-muted text-[10px] uppercase tracking-widest opacity-40">/month</span>
                            </div>

                            <ul className="space-y-5 mb-12 flex-1 relative z-10">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-4 text-[10px] font-black text-heaven-muted tracking-widest uppercase">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-soft-glow shrink-0">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="opacity-80">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSelectPlan(plan)}
                                variant={plan.popular ? "primary" : "secondary"}
                                className={cn(
                                    "w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px]",
                                    plan.popular && "shadow-soft-glow"
                                )}
                            >
                                {plan.popular ? 'Active in Beta' : (plan.upcoming ? 'Coming in V2' : 'View Plan Details')}
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Membership Guarantee Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="p-10 rounded-[3.5rem] flex flex-col group overflow-hidden bg-dark-navy border-white/[0.08]">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-soft-glow">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-heaven-text uppercase">Beta Period Policy</h3>
                            <p className="text-[10px] text-heaven-muted uppercase tracking-widest mt-1">Zero Charge Guarantee</p>
                        </div>
                    </div>
                    <p className="text-xs text-heaven-muted leading-relaxed mb-6 font-medium">
                        During the CreatorsHQ V1 Beta, all platform tools (AI Studio, Talent Discovery, CRM Pipeline, Campaigns, and Growth Diagnostics) are completely complimentary. Commercial subscription billing will be activated in V2 via approved payment gateways.
                    </p>
                    <div className="mt-auto p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-bold text-heaven-text">Your membership tier is fully unlocked. No credit card required.</span>
                    </div>
                </Card>

                <Card className="p-10 rounded-[3.5rem] border-white/[0.08] bg-white/[0.04] backdrop-blur-xl flex flex-col group overflow-hidden">
                    <h3 className="text-xl font-bold text-heaven-text mb-6 uppercase flex items-center gap-4">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Membership Record
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-heaven-text uppercase">CreatorsHQ Beta Member</p>
                                <p className="text-[10px] text-heaven-muted uppercase tracking-widest mt-1">Account: {user?.email}</p>
                            </div>
                            <span className="px-4 py-2 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-black uppercase tracking-wider">
                                Pro Verified
                            </span>
                        </div>
                        {transactions.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-heaven-muted">Recorded Ledger Events</p>
                                {transactions.map((tx, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-white/[0.02] flex justify-between text-xs text-heaven-muted">
                                        <span>Beta Access Token</span>
                                        <span className="font-bold text-emerald-400">Complimentary</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Beta Information Modal */}
            <Modal
                isOpen={isBetaModalOpen}
                onClose={() => setIsBetaModalOpen(false)}
                title={selectedPlan ? `${selectedPlan.name} Tier` : "Beta Membership"}
                className="bg-dark border border-white/10 rounded-[2.5rem]"
            >
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-heaven-text uppercase">Complimentary V1 Beta Access</h4>
                        <p className="text-xs text-heaven-muted leading-relaxed">
                            Thank you for participating in the CreatorsHQ V1 Beta! You currently have complete, unrestricted access to the <strong>{selectedPlan?.name || 'Radiance Pro'}</strong> feature set.
                        </p>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-heaven-muted">
                        <p className="font-bold text-heaven-text">What this means for you:</p>
                        <p>✓ Unlimited AI Content Studio generations</p>
                        <p>✓ Complete CRM Pipeline and brand collaboration tools</p>
                        <p>✓ Zero charges and no payment credentials required</p>
                    </div>

                    <Button
                        onClick={handleActivateBeta}
                        className="w-full h-16 rounded-[2rem] font-bold uppercase tracking-widest text-xs bg-primary hover:shadow-primary/20"
                    >
                        Continue Exploring CreatorsHQ
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
