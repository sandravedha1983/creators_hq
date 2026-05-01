import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, CreditCard, Banknote, ShieldCheck, History, Download, Plus, ArrowUpRight, Zap, Star, Lock, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import API from '@/services/api';

export default function Billing() {
    const { subscriptions, addSubscription } = useAppContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    
    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentData, setPaymentData] = useState({
        cardHolder: '',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });
    const [errors, setErrors] = useState<any>({});

    const handleInputCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').slice(0, 16);
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 3);
        } else if (name === 'expiryDate') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 2) {
                formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
            }
        }
        
        setPaymentData(prev => ({ ...prev, [name]: formattedValue }));
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!paymentData.cardHolder.trim()) newErrors.cardHolder = 'Name is required';
        if (paymentData.cardNumber.length !== 16) newErrors.cardNumber = 'Card number must be 16 digits';
        if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) newErrors.expiryDate = 'Invalid format (MM/YY)';
        if (paymentData.cvv.length !== 3) newErrors.cvv = 'CVV must be 3 digits';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddCard = () => {
        setSelectedPlan(null); // Just adding a card to registry
        setIsPaymentModalOpen(true);
    };

    const handleDeleteCard = (id: string) => {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
        toast.success('Identifier Purged');
    };

    const handleUpgrade = (plan: any) => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const processPayment = async () => {
        if (!validateForm()) return;

        setIsProcessing(true);
        try {
            const amountStr = selectedPlan ? selectedPlan.price.replace('₹', '') : '0';
            const amount = parseInt(amountStr) || 0;

            const response = await API.post('/api/billing/pay', {
                ...paymentData,
                amount,
                currency: 'INR'
            });

            if (response.data.success) {
                toast.success('Payment Successful ✅');
                
                if (selectedPlan) {
                    addSubscription({ plan: selectedPlan.name, amount: selectedPlan.price, status: 'Active' });
                }

                // Add to payment registry
                const newCard = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'VISA',
                    last4: paymentData.cardNumber.slice(-4),
                    expiry: paymentData.expiryDate,
                    label: 'User Linked'
                };
                setPaymentMethods(prev => [...prev, newCard]);
                
                setIsPaymentModalOpen(false);
                setPaymentData({ cardHolder: '', cardNumber: '', expiryDate: '', cvv: '' });
            } else {
                toast.error(response.data.message || 'Payment Failed ❌');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            const message = error.response?.data?.message || 'Payment Failed ❌';
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const plans = [
        { name: 'Essence', price: '₹0', desc: 'Standard creator tools', features: ['Social Analytics', 'AI Content Studio', 'Public Profile'] },
        { name: 'Radiance', price: '₹999', desc: 'High-performance growth', features: ['Advanced Analytics', 'Unlimited AI Studio', 'CRM & Leads'], popular: true },
        { name: 'Celestial', price: '₹2999', desc: 'Enterprise-grade scale', features: ['Team Management', 'Custom Domain', 'Priority Support'] },
    ];

    return (
        <div className="animate-fade-in pb-20 space-y-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-heaven-text tracking-tight uppercase cursor-default">Billing & Plans</h1>
                    <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft-glow" />
                        Registry Access: Active
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" className="h-14 px-8 rounded-2xl bg-dark-navy border-white/[0.08] text-heaven-muted font-bold flex items-center gap-3">
                        <History className="w-5 h-5 text-primary" />
                        Invoice History
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                {plans.map((plan, i) => {
                    const isActive = subscriptions.some(s => s.plan === plan.name);
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full"
                        >
                            <Card className={cn(
                                "p-10 flex flex-col h-full rounded-[4rem] relative overflow-hidden transition-all duration-700 hover:scale-[1.02]",
                                plan.popular && "border-primary/20 ring-1 ring-primary/10 shadow-primary/5"
                            )}>
                                {plan.popular && (
                                    <div className="absolute top-10 right-10 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold px-5 py-2 rounded-full uppercase tracking-widest shadow-soft-glow">
                                        RECOMENDED
                                    </div>
                                )}

                                <div className="mb-10">
                                    <h3 className="text-2xl font-bold text-heaven-text tracking-tight uppercase mb-2">{plan.name}</h3>
                                    <p className="text-[10px] font-black text-heaven-muted uppercase tracking-widest opacity-40">{plan.desc}</p>
                                </div>

                                <div className="mb-10 flex items-baseline gap-2 relative z-10">
                                    <span className="text-5xl font-black text-heaven-text tracking-tight">{plan.price}</span>
                                    <span className="font-bold text-heaven-muted text-[10px] uppercase tracking-widest opacity-40">/month</span>
                                </div>

                                <ul className="space-y-6 mb-12 flex-1 relative z-10">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-4 text-[10px] font-black text-heaven-muted tracking-widest uppercase">
                                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-soft-glow">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="opacity-80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => !isActive && handleUpgrade(plan)}
                                    variant={isActive ? "secondary" : "primary"}
                                    className={cn(
                                        "w-full h-18 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px]",
                                        isActive && "bg-white/[0.02] border-white/[0.08] opacity-60 cursor-default"
                                    )}
                                    disabled={isActive}
                                >
                                    {isActive ? 'Current Plan' : `Upgrade to ${plan.name}`}
                                </Button>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="p-10 rounded-[3.5rem] flex flex-col group overflow-hidden bg-dark-navy border-white/[0.08]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000" />
                    <h3 className="text-xl font-bold text-heaven-text mb-10 flex items-center gap-5 uppercase relative z-10">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-soft-glow">
                            <CreditCard className="w-7 h-7" />
                        </div>
                        Payment Registry
                    </h3>
                    <div className="space-y-6 relative z-10 flex-col flex h-full">
                        <div className="flex flex-col gap-4">
                            {paymentMethods.length === 0 ? (
                                <div className="py-20 border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-heaven-muted/20 space-y-4">
                                    <CreditCard className="w-12 h-12 opacity-5" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] ml-[0.4em]">Empty Registry</p>
                                </div>
                            ) : (
                                paymentMethods.map(method => (
                                    <div key={method.id} className="p-8 rounded-[2.5rem] bg-dark border border-white/[0.08] flex items-center justify-between group hover:border-primary/30 transition-all duration-500 shadow-glass">
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-10 bg-dark-navy rounded-xl border border-white/[0.08] flex items-center justify-center font-bold text-heaven-text text-[10px] tracking-widest shadow-inner">{method.type}</div>
                                            <div>
                                                <p className="text-sm font-black text-heaven-text tracking-widest uppercase leading-none">•••• •••• •••• {method.last4}</p>
                                                <p className="text-[10px] text-heaven-muted mt-3 font-bold uppercase tracking-[0.2em] opacity-40">Expires {method.expiry} • {method.label}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleDeleteCard(method.id)}
                                            variant="secondary"
                                            className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase bg-dark-navy border-white/[0.08] text-accent hover:bg-accent/10 hover:border-accent/20 transition-all"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button
                            onClick={handleAddCard}
                            variant="secondary"
                            className="w-full h-18 border-dashed border-white/20 bg-transparent rounded-[2.5rem] mt-auto flex items-center justify-center gap-4 font-bold text-heaven-muted hover:text-primary hover:border-primary/30 transition-all duration-500 text-[10px] uppercase tracking-[0.2em]"
                        >
                            <Plus className="w-6 h-6" />
                            Link New Identifier
                        </Button>
                    </div>
                </Card>

                <Card className="p-10 rounded-[3.5rem] border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-glass flex flex-col group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors duration-1000" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-xl font-bold text-heaven-text flex items-center gap-5 uppercase tracking-tight">
                            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-soft-glow">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            Activity Ledger
                        </h3>
                    </div>
                    <div className="space-y-4 min-h-[300px] flex flex-col relative z-10">
                        <AnimatePresence>
                            {subscriptions.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-heaven-muted opacity-10">
                                    <History className="w-20 h-20 mb-6" />
                                    <p className="text-[10px] font-bold uppercase tracking-[1em] ml-[1em]">Void</p>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    {subscriptions.map((inv: any, i: number) => (
                                        <motion.div
                                            key={inv.id || i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-6 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] rounded-[2rem] transition-all duration-500"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center text-secondary border border-white/[0.08] shadow-glass">
                                                    <Banknote className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-heaven-text uppercase tracking-tight opacity-80 leading-none">{inv.plan} Activation</p>
                                                    <p className="text-[10px] text-heaven-muted mt-2 font-bold uppercase tracking-widest opacity-30 leading-none">{inv.date || 'Processing Registry...'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <span className="text-xs font-bold text-heaven-text tracking-tighter">{inv.amount}</span>
                                                <button className="text-heaven-muted/20 hover:text-primary transition-all duration-300 p-2"><Download className="w-4 h-4" /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </div>
            <Modal 
                isOpen={isPaymentModalOpen} 
                onClose={() => !isProcessing && setIsPaymentModalOpen(false)}
                title={selectedPlan ? `Upgrade to ${selectedPlan.name}` : "Link New Identifier"}
                className="bg-dark border border-white/10 rounded-[2.5rem]"
            >
                <div className="space-y-6">
                    {selectedPlan && (
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Selected Plan</p>
                                <p className="text-xl font-bold text-heaven-text">{selectedPlan.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-heaven-muted">Total Amount</p>
                                <p className="text-xl font-black text-heaven-text">{selectedPlan.price}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-heaven-muted ml-1">Card Holder Name</label>
                            <input
                                name="cardHolder"
                                value={paymentData.cardHolder}
                                onChange={handleInputCardChange}
                                placeholder="Enter Name"
                                className={cn(
                                    "w-full h-14 bg-dark-navy border rounded-2xl px-6 text-heaven-text font-bold transition-all outline-none",
                                    errors.cardHolder ? "border-accent/50" : "border-white/10 focus:border-primary/50"
                                )}
                            />
                            {errors.cardHolder && <p className="text-[9px] text-accent font-bold uppercase tracking-widest ml-1">{errors.cardHolder}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-heaven-muted ml-1">Card Number</label>
                            <div className="relative">
                                <input
                                    name="cardNumber"
                                    value={paymentData.cardNumber}
                                    onChange={handleInputCardChange}
                                    placeholder="0000 0000 0000 0000"
                                    className={cn(
                                        "w-full h-14 bg-dark-navy border rounded-2xl px-6 text-heaven-text font-bold transition-all outline-none",
                                        errors.cardNumber ? "border-accent/50" : "border-white/10 focus:border-primary/50"
                                    )}
                                />
                                <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-heaven-muted/20" />
                            </div>
                            {errors.cardNumber && <p className="text-[9px] text-accent font-bold uppercase tracking-widest ml-1">{errors.cardNumber}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-heaven-muted ml-1">Expiry Date</label>
                                <input
                                    name="expiryDate"
                                    value={paymentData.expiryDate}
                                    onChange={handleInputCardChange}
                                    placeholder="MM/YY"
                                    className={cn(
                                        "w-full h-14 bg-dark-navy border rounded-2xl px-6 text-heaven-text font-bold transition-all outline-none",
                                        errors.expiryDate ? "border-accent/50" : "border-white/10 focus:border-primary/50"
                                    )}
                                />
                                {errors.expiryDate && <p className="text-[9px] text-accent font-bold uppercase tracking-widest ml-1">{errors.expiryDate}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-heaven-muted ml-1">CVV</label>
                                <div className="relative">
                                    <input
                                        name="cvv"
                                        type="password"
                                        value={paymentData.cvv}
                                        onChange={handleInputCardChange}
                                        placeholder="•••"
                                        className={cn(
                                            "w-full h-14 bg-dark-navy border rounded-2xl px-6 text-heaven-text font-bold transition-all outline-none",
                                            errors.cvv ? "border-accent/50" : "border-white/10 focus:border-primary/50"
                                        )}
                                    />
                                    <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-heaven-muted/20" />
                                </div>
                                {errors.cvv && <p className="text-[9px] text-accent font-bold uppercase tracking-widest ml-1">{errors.cvv}</p>}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={processPayment}
                        disabled={isProcessing}
                        className="w-full h-18 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] mt-8 bg-primary hover:shadow-primary/20"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing Registry...
                            </div>
                        ) : (
                            selectedPlan ? `Confirm Purchase (${selectedPlan.price})` : "Link Identifier"
                        )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 opacity-20">
                        <Lock className="w-3 h-3 text-heaven-muted" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-heaven-muted">Secure Encrypted Transaction</span>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Helper to keep the logic intact but rename if needed
const planNamePlaceholderCheck = (n: string) => n;
