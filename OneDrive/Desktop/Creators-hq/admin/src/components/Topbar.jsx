import { useState } from 'react'
import { Bell, Search, RefreshCw } from 'lucide-react'

export default function Topbar({ title, subtitle, onRefresh, loading }) {
  const [query, setQuery] = useState('')

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={14} color="var(--text-muted)" />
          <input
            placeholder="Search anything…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {onRefresh && (
          <button className="notif-btn" onClick={onRefresh} title="Refresh">
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
        )}

        <button className="notif-btn">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  )
}
