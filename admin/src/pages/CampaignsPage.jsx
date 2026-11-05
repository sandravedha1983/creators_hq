import { useEffect, useState } from 'react'
import { getCampaigns } from '../api'
import Topbar from '../components/Topbar'
import { Megaphone, Calendar, Users, Activity } from 'lucide-react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getCampaigns()
      setCampaigns(res.data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const active   = campaigns.filter(c => c.status === 'active').length
  const closed   = campaigns.filter(c => c.status === 'closed').length
  const pending  = campaigns.filter(c => c.status === 'pending' || !c.status).length

  return (
    <>
      <Topbar title="Campaigns" subtitle="All brand campaigns on the platform" onRefresh={fetchData} loading={loading} />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total', value: campaigns.length, color: 'var(--accent-light)' },
            { label: 'Active', value: active, color: 'var(--success)' },
            { label: 'Pending', value: pending, color: 'var(--warning)' },
            { label: 'Closed', value: closed, color: 'var(--text-muted)' },
          ].map(s => (
            <div className="stat-card" key={s.label} style={{ padding: '16px 20px' }}>
              <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ marginBottom: 0 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <Megaphone size={16} color="var(--accent-light)" />
            <h3>All Campaigns</h3>
            <span className="badge badge-muted">{campaigns.length} total</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <Megaphone size={36} />
                <p>No campaigns found.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Budget</th>
                    <th>Category</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div>
                          <div className="user-name">{c.title || c.name || 'Untitled Campaign'}</div>
                          {c.description && (
                            <div className="user-email" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {c.brand_id ? (
                          <div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{c.brand_id.name || '—'}</div>
                            <div className="user-email">{c.brand_id.email || ''}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          c.status === 'active' ? 'badge-success' :
                          c.status === 'closed' ? 'badge-muted' :
                          'badge-warning'
                        }`}>
                          {c.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {c.budget ? `$${c.budget.toLocaleString()}` : '—'}
                      </td>
                      <td>{c.category ? <span className="badge badge-info">{c.category}</span> : '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
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
