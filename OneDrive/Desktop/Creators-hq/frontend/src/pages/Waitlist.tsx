import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Instagram, Youtube, Globe2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { acceptWaitlistInvitation, submitWaitlistApplication } from '@/services/waitlistService';

const initialForm = {
  full_name: '',
  email: '',
  instagram_url: '',
  youtube_url: '',
  other_social_url: '',
  creator_niche: '',
  follower_count: '',
  introduction: '',
  reason_for_testing: ''
};

export default function Waitlist() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') || '';
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [invitationAccepted, setInvitationAccepted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        instagram_url: form.instagram_url || '',
        youtube_url: form.youtube_url || '',
        other_social_url: form.other_social_url || ''
      };

      const response = await submitWaitlistApplication(payload);
      if (!response?.success) {
        throw new Error(response?.message || 'Unable to confirm your application was saved.');
      }

      setSubmitted(true);
      setForm(initialForm);
      toast.success(response.message || 'Application submitted.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to submit your application right now.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setAccepting(true);
    try {
      const response = await acceptWaitlistInvitation(invitationToken);
      if (response?.success) {
        setInvitationAccepted(true);
        toast.success(response.message || 'Invitation accepted.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to accept this invitation.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08070B] text-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold uppercase tracking-[0.3em] text-primary">CreatorsHQ</Link>
          <Link to="/login" className="text-xs font-bold uppercase tracking-[0.25em] text-white/70 hover:text-white">Log in</Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-[2rem] border border-violet-500/20 bg-[#121017] p-8">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-[#E9D5FF]">Beta Access</p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              Be Among the First to Experience CreatorsHQ
            </h1>
            <p className="mt-6 text-base leading-7 text-[#C4B8CC]">
              CreatorsHQ is preparing something exciting for creators. Join our exclusive beta testing waitlist for an opportunity to experience the platform before its public launch.
            </p>

            <div className="mt-10 space-y-4 text-sm text-[#FAF7FF]">
              {[
                'Curated creator onboarding',
                'Early access to AI tools',
                'Priority campaign opportunities'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C084FC]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#392B42] bg-[#211A27] p-6 md:p-8">
            {invitationToken ? (
              <div className="rounded-2xl border border-[#392B42] bg-[#08070B] p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#C084FC]" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  {invitationAccepted ? 'Invitation accepted' : 'Your beta invitation'}
                </h2>
                <p className="mt-4 text-[#C4B8CC]">
                  {invitationAccepted
                    ? 'Your place in the CreatorsHQ beta has been confirmed.'
                    : 'Accept your invitation to confirm your place in the CreatorsHQ beta.'}
                </p>
                {!invitationAccepted && (
                  <Button
                    type="button"
                    variant="primary"
                    className="mt-8 w-full justify-center rounded-xl text-[10px] font-bold uppercase tracking-[0.3em]"
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                  >
                    {accepting ? 'Accepting...' : 'Accept invitation'}
                  </Button>
                )}
              </div>
            ) : !submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span>Full name</span>
                    <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="Your full name" />
                  </label>
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span>Email address</span>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="you@example.com" />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span className="flex items-center gap-2"><Instagram className="h-4 w-4 text-[#F0ABFC]" /> Instagram profile URL</span>
                    <input name="instagram_url" value={form.instagram_url} onChange={handleChange} required className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="https://instagram.com/yourhandle" />
                  </label>
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span className="flex items-center gap-2"><Youtube className="h-4 w-4 text-[#FF6FAE]" /> YouTube profile URL</span>
                    <input name="youtube_url" value={form.youtube_url} onChange={handleChange} className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="https://youtube.com/@channel" />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#C084FC]" /> Other social profile URL</span>
                    <input name="other_social_url" value={form.other_social_url} onChange={handleChange} className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="Optional link" />
                  </label>
                  <label className="space-y-2 text-sm text-[#FAF7FF]">
                    <span>Creator niche/category</span>
                    <input name="creator_niche" value={form.creator_niche} onChange={handleChange} required className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="Lifestyle, beauty, fitness ..." />
                  </label>
                </div>

                <label className="space-y-2 text-sm text-[#FAF7FF]">
                  <span>Approximate follower count</span>
                  <input name="follower_count" value={form.follower_count} onChange={handleChange} required className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="20k, 100k, 500k, etc." />
                </label>

                <label className="space-y-2 text-sm text-[#FAF7FF]">
                  <span>Short introduction</span>
                  <textarea name="introduction" value={form.introduction} onChange={handleChange} required rows={4} className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="Tell us a little bit about you and your content." />
                </label>

                <label className="space-y-2 text-sm text-[#FAF7FF]">
                  <span>Why do you want to test CreatorsHQ?</span>
                  <textarea name="reason_for_testing" value={form.reason_for_testing} onChange={handleChange} required rows={4} className="w-full rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none" placeholder="Share the type of opportunities you want to unlock." />
                </label>

                <Button type="submit" variant="primary" className="w-full justify-center rounded-xl text-[10px] font-bold uppercase tracking-[0.3em]" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Join the Waitlist'}
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Application received</h2>
                <p className="mt-4 text-[#C4B8CC]">
                  Your application is in review. We will be in touch if you are selected for the creator beta testing cohort.
                </p>
                <Link to="/" className="mt-8 inline-flex items-center text-sm font-bold uppercase tracking-[0.25em] text-primary">
                  Return home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
