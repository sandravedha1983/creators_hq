import { useEffect, useState } from 'react'
import { getLeads } from '../api'
import Topbar from '../components/Topbar'
import { Target, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getLeads()
      setLeads(res.data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const converted = leads.filter(l => l.status === 'converted' || l.converted).length
  const pending   = leads.filter(l => l.status === 'pending' || (!l.status && !l.converted)).length

  return (
    <>
      <Topbar title="Leads" subtitle="Creator & brand leads pipeline" onRefresh={fetchData} loading={loading} />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Leads', value: leads.length, color: 'var(--accent-light)' },
            { label: 'Converted', value: converted, color: 'var(--success)' },
            { label: 'Pending', value: pending, color: 'var(--warning)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ marginBottom: 0 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <Target size={16} color="var(--accent-light)" />
            <h3>All Leads</h3>
            <span className="badge badge-muted">{leads.length} total</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : leads.length === 0 ? (
              <div className="empty-state">
                <Target size={36} />
                <p>No leads found yet.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l._id || i}>
                      <td><div className="user-name">{l.name || l.firstName || '—'}</div></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{l.email || '—'}</td>
                      <td>{l.source ? <span className="badge badge-info">{l.source}</span> : '—'}</td>
                      <td>
                        <span className={`badge ${l.status === 'converted' || l.converted ? 'badge-success' : 'badge-warning'}`}>
                          {l.status === 'converted' || l.converted ? <><CheckCircle size={10} /> Converted</> : <><Clock size={10} /> Pending</>}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}
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
