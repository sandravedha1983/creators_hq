import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
                        <FileText className="w-4 h-4" />
                        <span>Platform Terms</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Terms of Service</h1>
                    <p className="text-xs text-heaven-muted uppercase tracking-widest font-bold">Effective Date: October 14, 2026</p>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-heaven-muted font-medium bg-white/[0.02] p-8 sm:p-12 rounded-[2.5rem] border border-white/[0.08]">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the CreatorsHQ platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">2. User Roles & Conduct</h2>
                        <p>
                            CreatorsHQ supports creator, brand, and verified administrative user roles. You are solely responsible for all content, messages, and campaign deliverables generated under your account. Prohibited actions include impersonation, submitting fraudulent verification proof, spamming collaboration requests, and attempting to bypass access controls.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">3. V1 Beta Terms</h2>
                        <p>
                            During the V1 Beta period, platform features are made available to registered users on a complimentary basis. CreatorsHQ reserves the right to calibrate algorithm metrics, adjust quota limits, and schedule maintenance downtime.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">4. Intellectual Property</h2>
                        <p>
                            You retain full ownership of all original content, portfolio assets, and media uploaded to your profile or submitted in campaign deliverables. CreatorsHQ retains ownership of its platform software, algorithms, branding, and user interface designs.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-heaven-text uppercase">5. Termination</h2>
                        <p>
                            We reserve the right to suspend or block access to users who violate these Terms, engage in fraud, or compromise community safety, following review by CreatorsHQ administrators.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
