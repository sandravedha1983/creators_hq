import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';

export default function VerifyOtp() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const { verifyOtp, user, isVerified, resendOtp } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleResend = async () => {
        if (timeLeft > 0 || isLoading) return;
        
        setIsLoading(true);
        try {
            const success = await resendOtp();
            if (success) {
                setTimeLeft(60);
                toast.success("Synchronizing verification flux...");
            }
        } catch (err: any) {
            console.error("Critical Resend Failure:", err);
            toast.error("System connection interrupted.");
        } finally {
            setIsLoading(false);
        }
    };

    const [isShaking, setIsShaking] = useState(false);

    React.useEffect(() => {
        if (isVerified && user) {
            const roleRedirects: Record<string, string> = {
                creator: '/creator-dashboard', // Matches App.tsx route
                brand: '/brand-dashboard',
                admin: '/admin-dashboard'
            };
            navigate(roleRedirects[user.role] || '/dashboard');
        }
    }, [isVerified, user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        if (value.length > 1) {
            const digits = value.split('').slice(0, 6);
            digits.forEach((d, i) => {
                if (index + i < 6) newOtp[index + i] = d;
            });
            setOtp(newOtp);
            return;
        }

        newOtp[index] = value;
        setOtp(newOtp);

        // Focus next input
        if (value !== '' && index < 5) {
            const next = e.target.parentElement?.children[index + 1] as HTMLInputElement;
            if (next) next.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prev = e.currentTarget.parentElement?.children[index - 1] as HTMLInputElement;
            if (prev) prev.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = otp.join('');
        
        if (otpString.length !== 6) {
            setError('Please enter the full 6-digit code.');
            triggerShake();
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const success = await verifyOtp(otpString);
            setIsLoading(false);

            if (success) {
                toast.success('Neural Link Established');
            } else {
                setError('Security mismatch. The access code provided is invalid or expired.');
                toast.error('Verification Failed');
                triggerShake();
            }
        } catch (err) {
            setIsLoading(false);
            setError('Neural uplink interrupted. Please try again.');
            toast.error('System Error');
            triggerShake();
        }
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />

            <motion.div
                animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full max-w-xl relative z-10"
            >
                <Card className="p-6 sm:p-16 bg-[#050810]/90 border border-white/[0.08] backdrop-blur-3xl rounded-[3rem] sm:rounded-[5rem] shadow-glass relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-button-gradient shadow-soft-glow" />

                    <div className="flex flex-col items-center mb-12 sm:mb-16 relative z-10">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 border border-primary/20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-primary mb-8 sm:mb-10 shadow-glass">
                            <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-heaven-text tracking-tight uppercase text-center">Neural Verification</h1>
                        <div className="text-heaven-muted text-[9px] sm:text-[10px] mt-6 text-center leading-relaxed font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] opacity-60">
                            Enter the 6-digit access code transmitted to <br />
                            <span className="text-primary font-black mt-3 block break-all px-4">{user?.email}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12 relative z-10">
                        <div className="grid grid-cols-6 gap-2 sm:gap-4">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    className={cn(
                                        "w-full h-14 sm:h-20 bg-black/40 border sm:border-2 rounded-xl sm:rounded-2xl text-center text-xl sm:text-4xl font-bold text-heaven-text focus:bg-black/60 focus:outline-none focus:ring-4 transition-all outline-none",
                                        error ? "border-rose-500/50 focus:ring-rose-500/10" : "border-white/[0.05] focus:border-primary/50 focus:ring-primary/10"
                                    )}
                                    type="text"
                                    maxLength={1}
                                    value={data}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onFocus={(e) => {
                                        e.target.select();
                                        setError('');
                                    }}
                                    required
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl"
                            >
                                <p className="text-rose-400 text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>
                            </motion.div>
                        )}

                        <div className="space-y-8">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-22 text-[12px] font-bold uppercase tracking-[0.5em] rounded-[2.5rem] shadow-soft-glow border-0"
                                isLoading={isLoading}
                                disabled={otp.some(v => v === '')}
                            >
                                Establish Link
                            </Button>
                            <div className="text-center text-[9px] text-heaven-muted font-bold uppercase tracking-[0.4em] opacity-40">
                                No signal received? 
                                <button 
                                    type="button" 
                                    onClick={handleResend}
                                    disabled={timeLeft > 0}
                                    className={cn(
                                        "text-primary font-bold transition-colors ml-2",
                                        timeLeft > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-heaven-text cursor-pointer"
                                    )}
                                >
                                    {timeLeft > 0 ? `Resend Flux in ${timeLeft}s` : "Resend Flux"}
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
