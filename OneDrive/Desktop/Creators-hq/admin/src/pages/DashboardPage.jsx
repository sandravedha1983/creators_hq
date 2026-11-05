import { useEffect, useState } from 'react'
import { getUsers, getCampaigns, getLeads, getHealth } from '../api'
import Topbar from '../components/Topbar'
import {
  Users, Megaphone, Target, Activity,
  TrendingUp, TrendingDown, UserCheck, UserX,
  Crown, Shield, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444']

const mockGrowth = [
  { month: 'May', users: 120, revenue: 4200 },
  { month: 'Jun', users: 185, revenue: 6800 },
  { month: 'Jul', users: 240, revenue: 9200 },
  { month: 'Aug', users: 310, revenue: 12400 },
  { month: 'Sep', users: 390, revenue: 16800 },
  { month: 'Oct', users: 470, revenue: 21500 },
]

export default function DashboardPage() {
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [leads, setLeads] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, c, l, h] = await Promise.allSettled([
        getUsers(), getCampaigns(), getLeads(), getHealth()
      ])
      if (u.status === 'fulfilled') setUsers(u.value.data.data || [])
      if (c.status === 'fulfilled') setCampaigns(c.value.data.data || [])
      if (l.status === 'fulfilled') setLeads(l.value.data.data || [])
      if (h.status === 'fulfilled') setHealth(h.value.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const admins    = users.filter(u => u.role === 'admin').length
  const creators  = users.filter(u => u.role === 'creator').length
  const brands    = users.filter(u => u.role === 'brand').length
  const blocked   = users.filter(u => u.isBlocked || u.is_blocked).length
  const proUsers  = users.filter(u => u.plan === 'pro').length
  const freeUsers = users.filter(u => u.plan !== 'pro').length

  const growthData = [
    'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
  ].map((m, idx) => {
    const monthUsers = users.filter(u => {
      const dt = u.created_at || u.createdAt;
      return dt && new Date(dt).getMonth() === (4 + idx);
    }).length;
    return {
      month: m,
      users: monthUsers > 0 ? monthUsers : (idx + 1) * Math.max(1, Math.round(users.length / 6)),
      revenue: (proUsers > 0 ? proUsers : 1) * (idx + 1) * 999
    };
  });

  const roleData = [
    { name: 'Creators', value: creators },
    { name: 'Brands', value: brands },
    { name: 'Admins', value: admins },
    { name: 'Blocked', value: blocked },
  ].filter(d => d.value > 0)

  const stats = [
    {
      icon: <Users size={18} />,
      iconBg: 'rgba(108,99,255,0.15)',
      iconColor: 'var(--accent-light)',
      label: 'Total Users',
      value: users.length,
      change: '+12%',
      up: true,
    },
    {
      icon: <Megaphone size={18} />,
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: 'var(--success)',
      label: 'Campaigns',
      value: campaigns.length,
      change: '+8%',
      up: true,
    },
    {
      icon: <Target size={18} />,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: 'var(--warning)',
      label: 'Leads',
      value: leads.length,
      change: '+23%',
      up: true,
    },
    {
      icon: <Crown size={18} />,
      iconBg: 'rgba(167,139,250,0.15)',
      iconColor: '#a78bfa',
      label: 'Pro Subscribers',
      value: proUsers,
      change: blocked > 0 ? `-${blocked} blocked` : '+5%',
      up: blocked === 0,
    },
  ]

  const recentUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`System ${health ? '🟢 Healthy' : '🔴 Offline'} • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`}
        onRefresh={fetchAll}
        loading={loading}
      />

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
              <div className="stat-value">{loading ? '—' : s.value.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
              <span className={`stat-change ${s.up ? 'up' : 'down'}`}>
                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.change}
              </span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="card">
            <div className="card-header">
              <Activity size={16} color="var(--accent-light)" />
              <h3>User & Revenue Growth</h3>
              <span className="badge badge-success">Live</span>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#6c63ff" fill="url(#gUsers)" strokeWidth={2} name="Users" />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#gRevenue)" strokeWidth={2} name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <Shield size={16} color="var(--accent-light)" />
              <h3>User Roles</h3>
            </div>
            <div style={{ padding: '16px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={roleData.length ? roleData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {(roleData.length ? roleData : [{}]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>{proUsers}</span> Pro
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{freeUsers}</span> Free
                </span>
                {blocked > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{blocked}</span> Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <UserCheck size={16} color="var(--accent-light)" />
            <h3>Recently Joined Users</h3>
            <span className="badge badge-muted">{users.length} total</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : recentUsers.length === 0 ? (
              <div className="empty-state">
                <Users size={40} />
                <p>No users found. Check your backend connection.</p>
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
                  {recentUsers.map(u => {
                    const color = u.role === 'admin' ? '#a78bfa' : u.role === 'brand' ? '#22c55e' : '#6c63ff'
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar" style={{ background: color }}>{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div>
                              <div className="user-name">{u.name}</div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-accent' : u.role === 'brand' ? 'badge-success' : 'badge-info'}`}>{u.role}</span></td>
                        <td><span className={`badge ${u.plan === 'pro' ? 'badge-accent' : 'badge-muted'}`}>{u.plan || 'free'}</span></td>
                        <td>
                          {u.isBlocked
                            ? <span className="badge badge-danger"><UserX size={10} /> Blocked</span>
                            : <span className="badge badge-success"><UserCheck size={10} /> Active</span>
                          }
                        </td>
                        <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
