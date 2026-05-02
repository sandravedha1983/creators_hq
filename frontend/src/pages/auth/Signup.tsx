import React, { useState } from 'react';
import logo from "@/assets/OIP (1).webp"
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Layers, User, Briefcase, Shield, Zap, Shield as ShieldIcon, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/utils/cn';
import loginVideo from "@/assets/istockphoto-2189725457-640_adpp_is.mp4";

export default function Signup() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('creator');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const validateEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            toast.error('Onboarding Failed');
            return;
        }

        const toastId = toast.loading('Initiating Neural Onboarding...');
        
        try {
            await signup(email, name, role, password);
            toast.success('Access Code Sent to Registered Mail ID', { id: toastId });
            navigate('/verify-otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Neural Link Interrupted. Please retry.');
            toast.error('Onboarding Failed', { id: toastId });
        }
    };

    const handleSocialLogin = (service: string) => {
        const baseURL = import.meta.env.VITE_API_URL || "";
        window.location.href = `${baseURL}/api/auth/${service.toLowerCase()}`;
    };

    const roles: { id: UserRole; label: string; icon: any; desc: string }[] = [
        { id: 'creator', label: 'Creator', icon: User, desc: 'Manage content & audience' },
        { id: 'brand', label: 'Brand', icon: Briefcase, desc: 'Find creators & run campaigns' }
    ];

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
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] animate-pulse delay-700 pointer-events-none" />

            <Card className="w-full max-w-2xl p-6 sm:p-16 bg-[#050810]/90 border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[4rem] shadow-glass relative z-10 overflow-hidden group hover:border-white/[0.12] transition-all duration-700">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-button-gradient shadow-soft-glow" />

                <div className="flex flex-col items-center mb-14 relative z-10 text-center">
                    <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 shadow-glass group-hover:rotate-6 transition-all duration-700 overflow-hidden bg-primary/10 border border-primary/20">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover relative z-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-heaven-text tracking-tighter leading-none mb-2">Join the Ecosystem</h1>
                    <p className="text-heaven-muted text-[10px] mt-6 font-bold uppercase tracking-[0.4em] opacity-70">Choose your role and begin your creative journey.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 relative z-10">
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => setRole(r.id)}
                            className={cn(
                                "flex flex-col items-center p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-700 group/btn",
                                role === r.id
                                    ? "border-primary/40 bg-primary/10 shadow-soft-glow"
                                    : "border-white/[0.05] bg-black/40 hover:border-white/[0.1] hover:bg-black/60"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-700 shadow-glass",
                                role === r.id ? "bg-primary text-white shadow-soft-glow" : "bg-white/[0.05] text-heaven-muted/60 group-hover/btn:text-heaven-text"
                            )}>
                                <r.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                            <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]", role === r.id ? "text-primary" : "text-heaven-muted/50")}>
                                {r.label}
                            </span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSignup} className="space-y-12 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-primary-light/90 ml-2">Display Name</label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-18 bg-black/40 border-white/[0.08] rounded-2xl focus:border-primary/30 transition-all outline-none px-8 font-bold text-heaven-text placeholder:text-heaven-text/50 text-[11px]"
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-primary-light/90 ml-2">Active Hub</label>
                            <div className="flex items-center gap-4 h-18 px-8 bg-primary/10 border border-primary/20 rounded-2xl font-bold text-[10px] text-primary uppercase tracking-[0.3em] cursor-default shadow-glass">
                                <Zap className="w-4 h-4 animate-pulse" />
                                {role} Access
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-primary-light/90 ml-2">Email Identity</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@creatorshq.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-18 bg-black/40 border-white/[0.08] rounded-2xl focus:border-primary/30 transition-all outline-none px-8 font-bold text-heaven-text placeholder:text-heaven-text/50 text-[11px]"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-primary-light/90 ml-2">Secure Password</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-heaven-muted/20 group-focus-within/input:text-primary transition-colors" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-18 bg-black/40 border-white/[0.08] rounded-2xl focus:border-primary/30 transition-all outline-none pl-16 pr-8 font-bold text-heaven-text placeholder:text-heaven-text/50 text-[11px]"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-rose-500 text-[10px] mt-4 ml-2 font-bold uppercase tracking-widest animate-pulse italic">{error}</p>}

                    <Button type="submit" variant="primary" className="w-full h-22 text-[11px] font-bold rounded-[2.5rem] shadow-soft-glow hover:scale-[1.02] active:scale-[0.98] transition-all border-0 mt-8">
                        Create Account <ArrowRight className="w-5 h-5 ml-4" />
                    </Button>
                </form>

                <div className="relative my-10 relative z-10">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/[0.05]"></span>
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.5em]">
                        <span className="bg-[#050810] px-8 text-heaven-muted/60 italic">Rapid Onboarding</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 relative z-10">
                    <Button
                        onClick={() => handleSocialLogin('Google')}
                        variant="secondary"
                        className="h-18 rounded-[2rem] border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-heaven-muted/60 font-bold text-[9px] uppercase tracking-widest group flex items-center justify-center gap-4 transition-all"
                    >
                        <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.6" />
                            <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" opacity="0.4" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.8" />
                        </svg>
                        Google
                    </Button>
                    <Button
                        onClick={() => handleSocialLogin('LinkedIn')}
                        variant="secondary"
                        className="h-18 rounded-[2rem] border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-heaven-muted/60 font-bold text-[9px] uppercase tracking-widest group flex items-center justify-center gap-4 transition-all"
                    >
                        <svg className="w-4 h-4 fill-[#0A66C2] opacity-60" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                        LinkedIn
                    </Button>
                </div>

                <div className="mt-16 text-center relative z-10">
                    <p className="text-heaven-muted opacity-80 text-[10px] font-bold uppercase tracking-[0.4em] italic">
                        Already registered?{' '}
                        <Link to="/login" className="text-primary hover:text-heaven-text transition-all font-bold ml-2 underline underline-offset-8">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
