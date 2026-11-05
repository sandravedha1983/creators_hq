import { useEffect, useState } from 'react'
import { getUsers } from '../api'
import Topbar from '../components/Topbar'
import { CreditCard, Crown, Users, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SubscriptionsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getUsers()
      setUsers(res.data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const proUsers  = users.filter(u => u.plan === 'pro')
  const freeUsers = users.filter(u => u.plan !== 'pro')

  const planData = [
    { name: 'Free', count: freeUsers.length, color: 'var(--text-muted)' },
    { name: 'Pro', count: proUsers.length, color: 'var(--accent)' },
  ]

  const upgradeRate = users.length > 0 ? ((proUsers.length / users.length) * 100).toFixed(1) : 0

  return (
    <>
      <Topbar
        title="Subscriptions"
        subtitle="Manage user plans and billing"
        onRefresh={fetchData}
        loading={loading}
      />

      <div className="page-content">
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Users', value: users.length, icon: <Users size={18} />, color: 'rgba(108,99,255,0.15)', ic: 'var(--accent-light)' },
            { label: 'Pro Subscribers', value: proUsers.length, icon: <Crown size={18} />, color: 'rgba(167,139,250,0.15)', ic: '#a78bfa' },
            { label: 'Free Users', value: freeUsers.length, icon: <CreditCard size={18} />, color: 'rgba(85,88,112,0.2)', ic: 'var(--text-muted)' },
            { label: 'Upgrade Rate', value: `${upgradeRate}%`, icon: <TrendingUp size={18} />, color: 'rgba(34,197,94,0.15)', ic: 'var(--success)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.color, color: s.ic }}>{s.icon}</div>
              <div className="stat-value">{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="charts-row">
          {/* Plan bar chart */}
          <div className="card">
            <div className="card-header">
              <BarChart size={16} color="var(--accent-light)" />
              <h3>Plan Distribution</h3>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={planData} barSize={48}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {planData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upgrade progress */}
          <div className="card">
            <div className="card-header">
              <Crown size={16} color="#a78bfa" />
              <h3>Conversion Metrics</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Pro Conversion</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{upgradeRate}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${upgradeRate}%`, background: 'linear-gradient(90deg, #6c63ff, #a78bfa)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Rate</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{users.length > 0 ? (((users.length - users.filter(u=>u.isBlocked).length) / users.length) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: users.length > 0 ? `${((users.length - users.filter(u=>u.isBlocked).length) / users.length) * 100}%` : '0%' }} />
                </div>
              </div>
              <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Estimated MRR</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
                  ${(proUsers.length * 29).toLocaleString()}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Based on $29/user/month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pro users table */}
        <div className="card">
          <div className="card-header">
            <Crown size={16} color="#a78bfa" />
            <h3>Pro Subscribers</h3>
            <span className="badge badge-accent">{proUsers.length} users</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : proUsers.length === 0 ? (
              <div className="empty-state">
                <Crown size={36} />
                <p>No pro subscribers yet.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {proUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: '#6c63ff' }}>
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${u.role === 'brand' ? 'badge-success' : 'badge-info'}`}>{u.role}</span></td>
                      <td><span className="badge badge-accent" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(167,139,250,0.15))', color: '#a78bfa' }}>✦ Pro</span></td>
                      <td><span className={`badge ${u.isBlocked ? 'badge-danger' : 'badge-success'}`}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
