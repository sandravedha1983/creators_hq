import { useEffect, useState } from 'react'
import { getUsers, getCampaigns } from '../api'
import Topbar from '../components/Topbar'
import { BarChart2, TrendingUp, Users, Megaphone } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnalyticsPage() {
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [u, c] = await Promise.allSettled([getUsers(), getCampaigns()])
      if (u.status === 'fulfilled') setUsers(u.value.data.data || [])
      if (c.status === 'fulfilled') setCampaigns(c.value.data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Build monthly signup chart from real data
  const monthlySignups = months.map((m, i) => ({
    month: m,
    users: users.filter(u => {
      const dateVal = u.created_at || u.createdAt;
      return dateVal && new Date(dateVal).getMonth() === i;
    }).length
  }))

  const roleBreakdown = [
    { name: 'Creators', value: users.filter(u => u.role === 'creator').length, color: '#6c63ff' },
    { name: 'Brands', value: users.filter(u => u.role === 'brand').length, color: '#22c55e' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#a78bfa' },
  ]

  return (
    <>
      <Topbar title="Analytics" subtitle="Platform-wide performance metrics" onRefresh={fetchData} loading={loading} />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Users', value: users.length, change: '+12%', up: true },
            { label: 'Verified Users', value: users.filter(u => u.isVerified || u.is_verified).length, change: `${users.length > 0 ? (((users.filter(u=>u.isVerified || u.is_verified).length)/users.length)*100).toFixed(0) : 0}%`, up: true },
            { label: 'Pro Subscribers', value: users.filter(u => u.plan === 'pro').length, change: '+5%', up: true },
            { label: 'Campaigns', value: campaigns.length, change: '+8%', up: true },
          ].map(s => (
            <div className="stat-card" key={s.label} style={{ padding: '16px 20px' }}>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
              <div className="stat-label" style={{ marginBottom: 8 }}>{s.label}</div>
              <span className={`stat-change ${s.up ? 'up' : 'down'}`}>
                <TrendingUp size={11} />{s.change}
              </span>
            </div>
          ))}
        </div>

        {/* Monthly signups */}
        <div className="card">
          <div className="card-header">
            <BarChart2 size={16} color="var(--accent-light)" />
            <h3>Monthly User Signups (Current Year)</h3>
          </div>
          <div style={{ padding: '16px 24px 24px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySignups} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="users" radius={[4, 4, 0, 0]} name="Signups">
                  {monthlySignups.map((_, i) => <Cell key={i} fill={i === new Date().getMonth() ? '#6c63ff' : 'rgba(108,99,255,0.4)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role breakdown */}
        <div className="two-col">
          <div className="card">
            <div className="card-header">
              <Users size={16} color="var(--accent-light)" />
              <h3>User Role Breakdown</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roleBreakdown.map(r => (
                <div key={r.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value} users</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: users.length > 0 ? `${(r.value / users.length) * 100}%` : '0%',
                        background: r.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <Megaphone size={16} color="var(--accent-light)" />
              <h3>Verification Status</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Verified', count: users.filter(u => u.verificationStatus === 'verified').length, color: 'var(--success)' },
                { label: 'Pending', count: users.filter(u => u.verificationStatus === 'pending').length, color: 'var(--warning)' },
                { label: 'Rejected', count: users.filter(u => u.verificationStatus === 'rejected').length, color: 'var(--danger)' },
                { label: 'Not Submitted', count: users.filter(u => u.verificationStatus === 'not_submitted' || !u.verificationStatus).length, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
