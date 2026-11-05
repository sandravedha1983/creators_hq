import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Authenticating Administrative Access...');
        try {
            await adminLogin(email, password);
            toast.success('Admin Access Granted.', { id: toastId });
            navigate('/admin/dashboard');
        } catch (err: any) {
            toast.error('Unauthorized Access Denied.', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <Card className="w-full max-w-lg p-6 sm:p-16 bg-[#050810]/95 border-primary/20 rounded-[2.5rem] sm:rounded-[4rem] shadow-glass relative z-10 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />

                <div className="flex flex-col items-center mb-12 sm:mb-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] sm:rounded-[2rem] flex items-center justify-center mb-8 sm:mb-10 shadow-glass bg-primary/10 border border-primary/20">
                         <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-heaven-text tracking-tighter leading-none mb-2 uppercase">Core Control</h1>
                    <p className="text-heaven-muted text-[9px] sm:text-[10px] mt-4 sm:mt-6 font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] opacity-70">
                        Administrative Console Access Only
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8 sm:space-y-10">
                    <div className="space-y-4 text-left">
                        <label className="text-[11px] font-bold text-primary-light ml-2">Admin Identifier</label>
                        <div className="relative group/input">
                            <Mail className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-heaven-muted/20 group-focus-within/input:text-primary transition-colors" />
                            <Input
                                type="email"
                                placeholder="admin@creatorshq.ai"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-16 sm:h-18 bg-black/60 border-white/[0.08] rounded-xl sm:rounded-2xl focus:border-primary/40 transition-all outline-none pl-14 sm:pl-16 pr-8 font-bold text-heaven-text"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <label className="text-[11px] font-bold text-primary-light ml-2">Secure Passkey</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-heaven-muted/20 group-focus-within/input:text-primary transition-colors" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-16 sm:h-18 bg-black/60 border-white/[0.08] rounded-xl sm:rounded-2xl focus:border-primary/40 transition-all outline-none pl-14 sm:pl-16 pr-8 font-bold text-heaven-text"
                                required
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full h-18 sm:h-22 text-[10px] sm:text-[11px] font-bold rounded-[2rem] sm:rounded-[2.5rem] bg-primary hover:bg-accent flex items-center justify-center gap-4 mt-4 border-0"
                        isLoading={isLoading}
                    >
                        Initialize Access <ArrowRight className="w-5 h-5" />
                    </Button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[8px] uppercase tracking-[0.5em] text-heaven-muted opacity-30">
                        Unauthorized Access Attempts are Logged
                    </p>
                </div>
            </Card>
        </div>
    );
}
