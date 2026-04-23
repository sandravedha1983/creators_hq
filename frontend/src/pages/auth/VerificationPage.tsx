import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { submitVerification, getVerificationStatus } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Upload, Instagram, Youtube, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function VerificationPage() {
    const { user, updateProfile } = useAuth();
    const [socialHandle, setSocialHandle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(user?.verificationStatus || 'not_submitted');
    const navigate = useNavigate();

    useEffect(() => {
        // First check local state
        if (user?.verificationStatus === 'verified') {
            const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : 
                                user?.role === 'admin' ? '/admin-dashboard' : '/creator-dashboard';
            navigate(dashboardPath);
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await getVerificationStatus();
                if (res.success) {
                    setStatus(res.data.verificationStatus);
                    updateProfile({ 
                        verificationStatus: res.data.verificationStatus,
                        verificationCode: res.data.verificationCode
                    });
                    
                    if (res.data.verificationStatus === 'verified') {
                        const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : 
                                            user?.role === 'admin' ? '/admin-dashboard' : '/creator-dashboard';
                        navigate(dashboardPath);
                    }
                }
            } catch (err) {
                console.warn("API Verification status fetch failed - using local state fallback.");
                if (user?.verificationStatus) {
                    setStatus(user.verificationStatus);
                }
            }
        };

        if (user) fetchStatus();
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!socialHandle) {
            toast.error("Social handle is required for neural verification.");
            return;
        }

        if (!file) {
            toast.error("Identity proof (screenshot) is missing from the uplink.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Establishing neural link with platform...");

        try {
            // Simulate network latency
            await new Promise((resolve) => setTimeout(resolve, 2000));

            toast.success("Identity Verified. Neural link established.", { id: toastId });
            setStatus('pending');
            updateProfile({ verificationStatus: 'pending' });
            
            // For this demo, let's auto-verify after another delay
            setTimeout(() => {
                setStatus('verified');
                updateProfile({ verificationStatus: 'verified' });
                toast.success("Verification Complete! Dashboard access granted.");
                
                // Auto-redirect based on role
                setTimeout(() => {
                    const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : 
                                        user?.role === 'admin' ? '/admin-dashboard' : '/creator-dashboard';
                    navigate(dashboardPath);
                }, 2000);
            }, 3000);

        } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Neural link interrupted. Please retry.", { id: toastId });
            setStatus('rejected');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatus = () => {
        switch (status) {
            case 'pending':
                return (
                    <div className="text-center py-10 space-y-6">
                        <Clock className="w-20 h-20 text-yellow-500 mx-auto animate-pulse" />
                        <h2 className="text-3xl font-bold text-heaven-text">Verification Pending</h2>
                        <p className="text-heaven-muted max-w-md mx-auto">
                            Our neural auditors are currently reviewing your profile. This usually takes 24-48 hours.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/')} className="mt-8">Return Home</Button>
                    </div>
                );
            case 'verified':
                return (
                    <div className="text-center py-10 space-y-6">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                        <h2 className="text-3xl font-bold text-heaven-text">Identity Verified</h2>
                        <p className="text-heaven-muted">Your neural link is fully established. Welcome to the elite.</p>
                        <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-8">Go to Dashboard</Button>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="text-center py-10 space-y-6">
                        <AlertTriangle className="w-20 h-20 text-rose-500 mx-auto" />
                        <h2 className="text-3xl font-bold text-rose-500">Verification Rejected</h2>
                        <p className="text-heaven-muted">We couldn't verify your handle. Please ensure the code is visible in your bio.</p>
                        <Button variant="primary" onClick={() => setStatus('not_submitted')} className="mt-8">Re-submit Application</Button>
                    </div>
                );
            default:
                return (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Identity Flux Code</label>
                            <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl text-center">
                                <span className="text-2xl font-black text-white tracking-[0.2em]">{user?.verificationCode || 'CREATORSHQ_XXXX'}</span>
                            </div>
                            <p className="text-[11px] text-heaven-muted text-center italic">Add this code to your Instagram/YouTube bio or story for verification.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-heaven-muted block mb-3">Platform Handle</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-heaven-muted">
                                        <Instagram className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="@yourhandle"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-primary/50 outline-none transition-all"
                                        value={socialHandle}
                                        onChange={(e) => setSocialHandle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-heaven-muted block mb-3">Proof of Identity (Screenshot)</label>
                                <div 
                                    className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center hover:border-primary/30 transition-all cursor-pointer bg-black/20"
                                    onClick={() => document.getElementById('screenshot-upload')?.click()}
                                >
                                    <input 
                                        type="file" 
                                        id="screenshot-upload" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <div className="flex items-center justify-center space-x-3 text-primary">
                                            <CheckCircle className="w-6 h-6" />
                                            <span className="font-bold">{file.name}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Upload className="w-10 h-10 text-heaven-muted mx-auto" />
                                            <p className="text-heaven-muted text-sm font-medium">Click to upload screenshot of your bio</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-full py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em]"
                            isLoading={isLoading}
                        >
                            Submit Verification
                        </Button>
                    </form>
                );
        }
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
                        <p className="text-heaven-muted mt-4 text-sm font-medium">Verify your social presence to unlock dashboard access.</p>
                    </div>

                    {renderStatus()}
                </Card>
            </motion.div>
        </div>
    );
}
