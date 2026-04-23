import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Instagram, CheckCircle, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { verifyCreator, checkVerification, getDashboardData } from '@/api';

export default function VerificationPage() {
    const { user, updateProfile } = useAuth();
    const [profileLink, setProfileLink] = useState('');
    const [verificationCode, setVerificationCode] = useState(user?.verificationCode || '');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'link' | 'code'>(user?.verificationCode ? 'code' : 'link');
    const [status, setStatus] = useState(user?.verificationStatus || 'not_submitted');
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.verificationStatus === 'verified') {
            const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : 
                                user?.role === 'admin' ? '/admin-dashboard' : '/creator-dashboard';
            navigate(dashboardPath);
        }
    }, [user, navigate]);

    const handleGenerateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileLink) {
            toast.error("Profile link is required for identification.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await verifyCreator(profileLink);
            if (res.success) {
                setVerificationCode(res.code);
                setStep('code');
                updateProfile({ verificationCode: res.code, socialHandle: profileLink });
                toast.success("Verification code generated.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to generate code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsLoading(true);
        try {
            const res = await checkVerification(profileLink || user?.socialHandle || '', verificationCode);
            if (res.success) {
                toast.success("Identity Verified! Welcome to CreatorsHQ.");
                updateProfile({ verificationStatus: 'verified' });
                setStatus('verified');
                setTimeout(() => {
                    const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : 
                                        user?.role === 'admin' ? '/admin-dashboard' : '/creator-dashboard';
                    navigate(dashboardPath);
                }, 2000);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Verification failed. Ensure the code is in your bio.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatus = () => {
        if (status === 'verified') {
            return (
                <div className="text-center py-10 space-y-6">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-heaven-text">Identity Verified</h2>
                    <p className="text-heaven-muted">Your neural link is fully established. Redirecting to dashboard...</p>
                </div>
            );
        }

        if (step === 'link') {
            return (
                <form onSubmit={handleGenerateCode} className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-heaven-muted block ml-2">Platform Profile Link</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-heaven-muted">
                                <Instagram className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="https://instagram.com/yourhandle"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-primary/50 outline-none transition-all"
                                value={profileLink}
                                onChange={(e) => setProfileLink(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-heaven-muted italic px-2">Provide the link to your primary social account (Instagram, YouTube, etc.)</p>
                    </div>
                    <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em]"
                        isLoading={isLoading}
                    >
                        Initiate Verification <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            );
        }

        return (
            <div className="space-y-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Identity Flux Code</label>
                    <div className="p-8 bg-primary/10 border border-primary/20 rounded-3xl text-center relative group">
                        <span className="text-3xl font-black text-white tracking-[0.3em]">{verificationCode}</span>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                        <p className="text-sm text-heaven-text font-medium">Follow these steps:</p>
                        <ul className="text-xs text-heaven-muted space-y-2 list-disc pl-4">
                            <li>Copy the code above.</li>
                            <li>Add it to your bio on the linked social platform.</li>
                            <li>Wait a few seconds for propagation.</li>
                            <li>Click the verify button below.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button 
                        variant="primary" 
                        className="flex-1 py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em]"
                        onClick={handleCheckVerification}
                        isLoading={isLoading}
                    >
                        Verify Now
                    </Button>
                    <Button 
                        variant="secondary" 
                        className="px-8 rounded-3xl"
                        onClick={() => setStep('link')}
                        disabled={isLoading}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                <Card className="p-8 sm:p-16 bg-[#050810]/90 border border-white/[0.08] backdrop-blur-3xl rounded-[3rem] shadow-glass relative">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-button-gradient shadow-soft-glow rounded-t-full" />
                    
                    <div className="flex flex-col items-center mb-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary mb-8 shadow-glass">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-black text-heaven-text tracking-tight uppercase">Creator Verification</h1>
                        <p className="text-heaven-muted mt-4 text-sm font-medium">Establish your identity to unlock the full SaaS engine.</p>
                    </div>

                    {renderStatus()}
                </Card>
            </motion.div>
        </div>
    );
}
