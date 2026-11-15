import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { submitVerification, getVerificationStatus } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type VerificationState = {
    status: string;
    isVerified: boolean;
    isSuspended: boolean;
    request: { decision_reason?: string | null } | null;
};

const initialCreator = {
    full_name: '',
    niche: '',
    location: '',
    portfolio: '',
    website: '',
    social_links: { instagram: '', youtube: '', tiktok: '', linkedin: '', twitter: '' }
};

const initialBrand = {
    company_name: '',
    business_email: '',
    website: '',
    industry: '',
    description: '',
    representative_name: '',
    location: '',
    social_links: { linkedin: '', instagram: '', twitter: '' }
};

const statusLabels: Record<string, string> = {
    not_submitted: 'Not submitted',
    pending: 'Pending Admin review',
    under_review: 'Under review',
    additional_information_required: 'Additional information required',
    verified: 'Verified',
    rejected: 'Not approved',
    suspended: 'Suspended'
};

export default function VerificationPage() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [state, setState] = useState<VerificationState>({
        status: user?.verificationStatus || 'not_submitted',
        isVerified: false,
        isSuspended: false,
        request: null
    });
    const [creator, setCreator] = useState({ ...initialCreator, full_name: user?.name || '' });
    const [brand, setBrand] = useState({ ...initialBrand, business_email: user?.email || '' });
    const [documents, setDocuments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const loadStatus = async () => {
        setLoadingStatus(true);
        try {
            const response = await getVerificationStatus();
            setState(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not load verification status.');
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => { void loadStatus(); }, []);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!user || documents.length === 0) {
            toast.error('Upload at least one supporting document.');
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('application', JSON.stringify(user.role === 'brand' ? brand : creator));
        documents.forEach(file => formData.append('documents', file));
        try {
            const response = await submitVerification(formData);
            setState(current => ({
                ...current,
                status: response.data.status,
                isVerified: false,
                request: response.data.request
            }));
            if (response.notificationDelivered === false) {
                  toast.error('Application submitted, but we could not send the notification. Please check your status here.');
            } else {
                  toast.success('Application submitted for mandatory Admin review.');
            }
            await loadStatus();
            try {
                await refreshProfile();
            } catch (profileError) {
                console.error('Verification was submitted, but the profile status could not be refreshed.', profileError);
                toast.error('Application submitted. Reload the page if your account status does not update.');
            }
        } catch (error: any) {
            const message = error.response?.data?.errors?.join(' ') ||
                error.response?.data?.message ||
                'Could not submit your verification application.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !state.isSuspended &&
        ['not_submitted', 'rejected', 'additional_information_required'].includes(state.status);
    const setCreatorValue = (key: string, value: string) =>
        setCreator(current => ({ ...current, [key]: value }));
    const setBrandValue = (key: string, value: string) =>
        setBrand(current => ({ ...current, [key]: value }));
    const setSocial = (role: 'creator' | 'brand', key: string, value: string) => {
        if (role === 'creator') {
            setCreator(current => ({ ...current, social_links: { ...current.social_links, [key]: value } }));
        } else {
            setBrand(current => ({ ...current, social_links: { ...current.social_links, [key]: value } }));
        }
    };

    const dashboardPath = user?.role === 'brand' ? '/brand-dashboard' : '/creator-dashboard';

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4 sm:p-8">
            <Card className="w-full max-w-3xl p-6 sm:p-10 bg-[#050810]/90 border border-white/10">
                <header className="mb-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                        {user?.role === 'brand' ? 'Brand' : 'Creator'} verification
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-heaven-text">Verification Center</h1>
                    <p className="mt-3 text-sm text-heaven-muted">
                        Automated checks validate completeness and file format only. Every application requires a final Admin decision.
                    </p>
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-heaven-muted">Current status</span>
                            <strong className="text-sm text-heaven-text">
                                {loadingStatus ? 'Loading…' : statusLabels[state.status] || state.status}
                            </strong>
                        </div>
                        {state.request?.decision_reason && (
                            <p className="mt-3 text-sm text-heaven-muted">
                                Admin response: <span className="text-heaven-text">{state.request.decision_reason}</span>
                            </p>
                        )}
                        {state.isSuspended && (
                            <p className="mt-3 text-sm text-red-300">This account is suspended and cannot submit another application.</p>
                        )}
                    </div>
                </header>

                {canSubmit ? (
                    <form onSubmit={submit} className="space-y-6">
                        {user?.role === 'creator' ? (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Full name" value={creator.full_name} onChange={value => setCreatorValue('full_name', value)} required />
                                    <Field label="Creator niche" value={creator.niche} onChange={value => setCreatorValue('niche', value)} required />
                                    <Field label="Location" value={creator.location} onChange={value => setCreatorValue('location', value)} required />
                                    <Field label="Website" value={creator.website} onChange={value => setCreatorValue('website', value)} type="url" />
                                    <Field label="Portfolio URL" value={creator.portfolio} onChange={value => setCreatorValue('portfolio', value)} type="url" />
                                </div>
                                <SocialFields values={creator.social_links} onChange={(key, value) => setSocial('creator', key, value)} />
                            </>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Company name" value={brand.company_name} onChange={value => setBrandValue('company_name', value)} required />
                                    <Field label="Business email" value={brand.business_email} onChange={value => setBrandValue('business_email', value)} type="email" required />
                                    <Field label="Company website" value={brand.website} onChange={value => setBrandValue('website', value)} type="url" required />
                                    <Field label="Industry" value={brand.industry} onChange={value => setBrandValue('industry', value)} required />
                                    <Field label="Authorized representative" value={brand.representative_name} onChange={value => setBrandValue('representative_name', value)} required />
                                    <Field label="Location" value={brand.location} onChange={value => setBrandValue('location', value)} />
                                </div>
                                <label className="block text-sm text-heaven-muted">
                                    Company description
                                    <textarea
                                        className="mt-2 w-full min-h-28 rounded-xl border border-white/10 bg-black/30 p-3 text-heaven-text"
                                        value={brand.description}
                                        onChange={event => setBrandValue('description', event.target.value)}
                                        required
                                        maxLength={3000}
                                    />
                                </label>
                                <SocialFields values={brand.social_links} onChange={(key, value) => setSocial('brand', key, value)} />
                            </>
                        )}
                        <label className="block text-sm text-heaven-muted">
                            Supporting evidence (PDF, JPEG or PNG; up to 10 MB each)
                            <input
                                className="mt-2 block w-full text-sm text-heaven-text"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                multiple
                                required
                                onChange={event => setDocuments(Array.from(event.target.files || []).slice(0, 5))}
                            />
                            <span className="mt-1 block text-xs">Creator ownership evidence or Brand business-registration evidence. Files are private and visible to authorized Admin reviewers only.</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" variant="primary" isLoading={loading}>
                                Submit for Admin review
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => navigate(dashboardPath)}>
                                Return to dashboard
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="primary" onClick={() => navigate(dashboardPath)}>
                            Return to dashboard
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => void loadStatus()}>
                            Refresh status
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    required = false,
    type = 'text'
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    type?: string;
}) {
    return (
        <label className="block text-sm text-heaven-muted">
            {label}
            <input
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-heaven-text"
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                required={required}
                maxLength={type === 'url' ? 2048 : 300}
            />
        </label>
    );
}

function SocialFields({
    values,
    onChange
}: {
    values: Record<string, string>;
    onChange: (platform: string, value: string) => void;
}) {
    return (
        <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-heaven-text">Social profile links (optional)</legend>
            {Object.entries(values).map(([platform, value]) => (
                <Field
                    key={platform}
                    label={platform[0].toUpperCase() + platform.slice(1)}
                    value={value}
                    onChange={next => onChange(platform, next)}
                    type="url"
                />
            ))}
        </fieldset>
    );
}
