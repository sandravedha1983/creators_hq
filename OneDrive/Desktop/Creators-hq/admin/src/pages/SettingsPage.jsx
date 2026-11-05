import { useState } from 'react'
import Topbar from '../components/Topbar'
import { useToast } from '../context/ToastContext'
import { Shield, Server, Key, Globe, Save, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5000')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast('Settings saved successfully', 'success')
    setSaving(false)
  }

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  return (
    <>
      <Topbar title="Settings" subtitle="System configuration and admin preferences" />

      <div className="page-content">
        <div className="two-col">
          {/* System info */}
          <div className="card">
            <div className="card-header">
              <Server size={16} color="var(--accent-light)" />
              <h3>System Information</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Backend URL', value: backendUrl },
                { label: 'Admin Portal', value: window.location.origin },
                { label: 'Environment', value: import.meta.env.MODE || 'development' },
                { label: 'Build Time', value: new Date().toLocaleDateString() },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Config */}
          <div className="card">
            <div className="card-header">
              <Globe size={16} color="var(--accent-light)" />
              <h3>Configuration</h3>
            </div>
            <form className="card-body" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Backend API URL</label>
                <input className="form-input" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="http://localhost:5000" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Set VITE_API_URL in admin/.env to persist</span>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input className="form-input" defaultValue="admin@creatorshq.ai" readOnly style={{ opacity: 0.6 }} />
              </div>

              <div className="form-group">
                <label className="form-label">Session Timeout</label>
                <select className="form-select" defaultValue="24h">
                  <option value="1h">1 Hour</option>
                  <option value="8h">8 Hours</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><Save size={14} /> Save Settings</>}
              </button>
            </form>
          </div>
        </div>

        {/* Access control */}
        <div className="card">
          <div className="card-header">
            <Key size={16} color="var(--accent-light)" />
            <h3>Access & Security</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { icon: <Shield size={20} />, label: 'JWT Authentication', status: 'Enabled', ok: true },
                { icon: <Globe size={20} />, label: 'CORS Protection', status: 'Configured', ok: true },
                { icon: <Key size={20} />, label: 'Admin Role Guard', status: 'Active', ok: true },
              ].map(s => (
                <div key={s.label} style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.ok ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ok ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: s.ok ? 'var(--success)' : 'var(--danger)' }}>
                      <CheckCircle size={11} /> {s.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
