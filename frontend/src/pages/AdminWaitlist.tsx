import React, { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, CheckCircle2, Clock3, XCircle, Mail, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { getWaitlistAdminData, updateWaitlistStatus, createWaitlistInvitation } from '@/services/waitlistService';

const defaultSummary = {
  total: 0,
  pending: 0,
  selected: 0,
  invited: 0,
  accepted: 0,
  rejected: 0,
  declined: 0
};

const statusColors: Record<string, string> = {
  pending: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300',
  selected: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  invited: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  accepted: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  declined: 'border-gray-500/20 bg-gray-500/10 text-gray-300'
};

export default function AdminWaitlist() {
  const [applications, setApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await getWaitlistAdminData();
      setApplications(res?.data || []);
      setSummary(res?.summary || defaultSummary);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load waitlist data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const query = searchTerm.toLowerCase();
      const matchesQuery = !query || `${app.full_name} ${app.email}`.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [applications, statusFilter, searchTerm]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await updateWaitlistStatus(id, status);
      toast.success(res?.message || 'Status updated.');
      await loadApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update status.');
    }
  };

  const handleInvite = async (id: string) => {
    try {
      const res = await createWaitlistInvitation(id);
      if (res?.success === false) {
        toast.error(res?.message || 'Unable to send invitation.');
      } else {
        toast.success(res?.message || 'Invitation sent.');
      }
      await loadApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to send invitation.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-10 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#E9D5FF]">Admin controls</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">Creator Waitlist</h1>
        </div>
        <Button variant="primary" className="rounded-xl px-5 py-3 text-[10px] uppercase tracking-[0.25em]" onClick={loadApplications}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total applications', value: summary.total, icon: Sparkles },
          { label: 'Pending', value: summary.pending, icon: Clock3 },
          { label: 'Selected', value: summary.selected, icon: CheckCircle2 },
          { label: 'Invited', value: summary.invited, icon: Mail },
          { label: 'Accepted', value: summary.accepted, icon: CheckCircle2 },
          { label: 'Rejected', value: summary.rejected, icon: XCircle }
        ].map((card) => (
          <div key={card.label} className="rounded-[1.5rem] border border-[#392B42] bg-[#121017] p-5">
            <div className="mb-4 flex items-center justify-between text-[#C4B8CC]">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">{card.label}</span>
              <card.icon className="h-4 w-4 text-[#C084FC]" />
            </div>
            <div className="text-3xl font-black text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-[#392B42] bg-[#121017] p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85798D]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-[#392B42] bg-[#08070B] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#85798D] focus:border-[#A855F7] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[#392B42] bg-[#08070B] px-4 py-3 text-sm text-[#FAF7FF]">
            <Filter className="h-4 w-4 text-[#C084FC]" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-white focus:outline-none">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="selected">Selected</option>
              <option value="invited">Invited</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="declined">Declined</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.25em] text-[#C4B8CC]">
              <tr>
                <th className="pb-4 pr-4">Creator</th>
                <th className="pb-4 pr-4">Niche</th>
                <th className="pb-4 pr-4">Followers</th>
                <th className="pb-4 pr-4">Date</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#C4B8CC]">Loading waitlist...</td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#C4B8CC]">No applications match the current filters.</td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const invitationExpired = app.status === 'invited'
                    && app.invitation_expires_at
                    && new Date(app.invitation_expires_at).getTime() <= Date.now();
                  return (
                  <tr key={app.id} className="border-t border-[#392B42] align-top">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-white">{app.full_name}</div>
                      <div className="text-[#C4B8CC]">{app.email}</div>
                      <div className="mt-1 text-[#E9D5FF]">
                        {app.instagram_url ? <a href={app.instagram_url} className="mr-2 hover:text-white" target="_blank" rel="noreferrer">Instagram</a> : null}
                        {app.youtube_url ? <a href={app.youtube_url} className="hover:text-white" target="_blank" rel="noreferrer">YouTube</a> : null}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-[#C4B8CC]">{app.creator_niche}</td>
                    <td className="py-4 pr-4 text-[#C4B8CC]">{app.follower_count}</td>
                    <td className="py-4 pr-4 text-[#C4B8CC]">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${statusColors[app.status] || 'border-[#392B42] bg-[#08070B] text-[#FAF7FF]'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {app.status === 'pending' && (
                          <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(app.id, 'selected')} className="rounded-lg px-3 py-2 text-[9px] tracking-[0.2em]">Select</Button>
                        )}
                        {(app.status === 'pending' || app.status === 'selected') && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(app.id, 'rejected')} className="rounded-lg px-3 py-2 text-[9px] tracking-[0.2em]">Reject</Button>
                        )}
                        {(app.status === 'selected' || invitationExpired) && (
                          <Button size="sm" variant="primary" onClick={() => handleInvite(app.id)} className="rounded-lg px-3 py-2 text-[9px] tracking-[0.2em]">{invitationExpired ? 'Re-invite' : 'Invite'}</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
