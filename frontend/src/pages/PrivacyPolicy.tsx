import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-dark text-heaven-text font-sans p-6 sm:p-12 relative overflow-hidden">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center justify-between border-b border-white/10 pb-8">
                    <Link to="/" className="flex items-center gap-4">
                        <Logo size="md" />
                        <span className="font-bold text-xl uppercase tracking-wider text-heaven-text">CreatorsHQ</span>
                    </Link>
                    <Link to="/">
                        <Button variant="secondary" className="h-12 px-6 rounded-2xl border-white/10 text-xs uppercase font-bold">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
                        <Shield className="w-4 h-4" />
                        <span>Legal & Privacy Compliance</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Privacy Policy</h1>
                    <p className="text-xs text-heaven-muted uppercase tracking-widest font-bold">Effective Date: October 14, 2026</p>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-heaven-muted font-medium bg-white/[0.02] p-8 sm:p-12 rounded-[2.5rem] border border-white/[0.08]">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">1. Information We Collect</h2>
                        <p>
                            CreatorsHQ collects information you provide directly to us when creating an account, updating your profile, linking third-party social media profiles, communicating with brands or creators, and utilizing our AI studio tools.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Account Identity: Name, email address, password hashes managed securely through Supabase Auth.</li>
                            <li>Profile Information: Social handles, bios, niche categories, location, and portfolio links.</li>
                            <li>Platform Communications: Collaboration proposals and campaign briefs.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">2. Use of Information</h2>
                        <p>
                            We use the information we collect to operate, provide, maintain, and protect the CreatorsHQ ecosystem; facilitate brand sponsorships and creator discovery; track Growth Score indicators; and enforce safety guidelines.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">3. Data Protection & Security</h2>
                        <p>
                            CreatorsHQ enforces PostgreSQL Row Level Security (RLS) on all user data. Service-role credentials and private access keys are strictly isolated to server-side environments. We never sell your personal information or publicly expose creator email addresses on discovery boards.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">4. Third-Party Integrations</h2>
                        <p>
                            When you connect third-party platforms (such as Google, LinkedIn, or Instagram), we only request read-level access necessary to verify ownership and display aggregated statistics.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">5. Contact Us</h2>
                        <p>
                            If you have any questions or feedback regarding this Privacy Policy, please submit an in-app report or contact our administrative team at privacy@creatorshq.ai.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
