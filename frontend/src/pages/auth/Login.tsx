import React, { useState } from 'react';
import logo from "@/assets/OIP (1).webp"
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Layers, Mail, Lock, Zap, Shield, User, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import loginVideo from "@/assets/istockphoto-2189725457-640_adpp_is.mp4";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Establishing Neural Link...');
        try {
            await login(email, password);
            toast.success('Neural Access Granted. Verify Identity.', { id: toastId });
            navigate('/verify-otp');
        } catch (err: any) {
            toast.error('Neural Mismatch. Check Credentials.', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (service: string) => {
        const baseURL = import.meta.env.VITE_API_URL || "";
        window.location.href = `${baseURL}/api/auth/${service.toLowerCase()}`;
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
            >
                <source src={loginVideo} type="video/mp4" />
            </video>
            
            {/* Background Effects: Heavenly Glows */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark via-transparent to-dark z-0 opacity-80" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] animate-pulse delay-700 pointer-events-none" />

            <Card className="w-full max-w-lg p-6 sm:p-16 bg-[#050810]/90 border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[4rem] shadow-glass relative z-10 overflow-hidden group hover:border-white/[0.12] transition-all duration-700">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-button-gradient shadow-soft-glow" />

                <div className="flex flex-col items-center mb-12 sm:mb-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] sm:rounded-[2rem] flex items-center justify-center mb-8 sm:mb-10 shadow-glass group-hover:rotate-6 transition-all duration-700 overflow-hidden bg-primary/10 border border-primary/20">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover relative z-10" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-heaven-text tracking-tighter leading-none mb-2">Welcome Back</h1>
                    <p className="text-heaven-muted text-[9px] sm:text-[10px] mt-4 sm:mt-6 font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] flex items-center gap-2 sm:gap-3 opacity-70">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Secure Access to your Creative Hub
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8 sm:space-y-10">
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

                    <div className="space-y-4 text-left">
                        <div className="flex items-center justify-between ml-2">
                            <label className="text-[11px] font-bold text-primary-light/90">Password</label>
                            <a href="#" className="text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-widest hover:text-heaven-text transition-all opacity-80 hover:opacity-100">Forgot Code?</a>
                        </div>
                        <div className="relative group/input">
                            <Lock className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-heaven-muted/20 group-focus-within/input:text-primary transition-colors" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-16 sm:h-18 bg-black/40 border-white/[0.08] rounded-xl sm:rounded-2xl focus:border-primary/30 focus:bg-black/60 transition-all outline-none pl-14 sm:pl-16 pr-8 font-bold text-heaven-text placeholder:text-heaven-text/50"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" variant="primary" className="w-full h-18 sm:h-22 text-[10px] sm:text-[11px] font-bold rounded-[2rem] sm:rounded-[2.5rem] shadow-soft-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-4">
                        Sign In <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                    </Button>
                </form>

                <div className="relative my-12 sm:my-16">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/[0.05]"></span>
                    </div>
                    <div className="relative flex justify-center text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.5em]">
                        <span className="bg-dark/20 backdrop-blur-md px-6 sm:px-8 text-heaven-muted opacity-80 italic">Unified Connect</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <button
                        onClick={() => handleSocialLogin('Google')}
                        className="h-16 sm:h-18 rounded-[1.5rem] sm:rounded-[1.75rem] font-bold text-[9px] uppercase tracking-widest bg-white/[0.04] hover:bg-white/[0.06] flex items-center justify-center gap-4 border border-white/[0.08] text-heaven-muted hover:text-heaven-text transition-all shadow-glass"
                    >
                        <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.6" />
                            <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" opacity="0.4" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.8" />
                        </svg>
                        Google
                    </button>
                    <button
                        onClick={() => handleSocialLogin('LinkedIn')}
                        className="h-16 sm:h-18 rounded-[1.5rem] sm:rounded-[1.75rem] font-bold text-[9px] uppercase tracking-widest bg-white/[0.04] hover:bg-white/[0.06] flex items-center justify-center gap-4 border border-white/[0.08] text-heaven-muted hover:text-heaven-text transition-all shadow-glass"
                    >
                        <svg className="w-4 h-4 fill-[#0A66C2] opacity-60" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                        LinkedIn
                    </button>
                </div>
                <div className="mt-12 sm:mt-16 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
                    <p className="text-heaven-muted opacity-80 italic">
                        New Member?{' '}
                        <Link to="/signup" className="text-primary hover:text-heaven-text transition-all ml-2 underline underline-offset-8 decoration-primary/30">
                            Create Account
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
