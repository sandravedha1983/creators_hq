import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '@/services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await API.post('/api/auth/forgot-password', { email });
            setSent(true);
            toast.success('If an account exists, a reset link has been sent.');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send reset email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            
            <Card className="w-full max-w-lg p-6 sm:p-16 bg-[#050810]/90 border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[4rem] shadow-glass relative z-10 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-button-gradient shadow-soft-glow" />

                <div className="flex flex-col items-center mb-12 sm:mb-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] sm:rounded-[2rem] flex items-center justify-center mb-8 sm:mb-10 shadow-glass bg-primary/10 border border-primary/20">
                        <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-heaven-text tracking-tighter leading-none mb-2">Reset Password</h1>
                    <p className="text-heaven-muted text-[9px] sm:text-[10px] mt-4 sm:mt-6 font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] opacity-70">
                        We'll send you a secure reset link
                    </p>
                </div>

                {sent ? (
                    <div className="text-center space-y-8">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-heaven-text">Check Your Email</h2>
                            <p className="text-heaven-muted text-sm opacity-70">If an account exists with <strong className="text-primary">{email}</strong>, you'll receive a password reset link shortly.</p>
                        </div>
                        <Link to="/login" className="inline-flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-heaven-text transition-all">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4 text-left">
                            <label className="text-[11px] font-bold text-primary-light/90 ml-2">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-heaven-muted/20 group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="name@creatorshq.ai"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-16 sm:h-18 bg-black/40 border-white/[0.08] rounded-xl sm:rounded-2xl focus:border-primary/30 focus:bg-black/60 transition-all outline-none pl-14 sm:pl-16 pr-8 font-bold text-heaven-text placeholder:text-heaven-text/50 text-[11px]"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full h-18 sm:h-22 text-[10px] sm:text-[11px] font-bold rounded-[2rem] sm:rounded-[2.5rem] shadow-soft-glow" isLoading={isLoading}>
                            Send Reset Link
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-heaven-muted text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-all opacity-60">
                                <ArrowLeft className="w-3 h-3" /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}
