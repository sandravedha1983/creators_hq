import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, BarChart2,
  Megaphone, Target, Shield, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
      { to: '/analytics', icon: <BarChart2 size={16} />, label: 'Analytics' },
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/users', icon: <Users size={16} />, label: 'Users', badge: null },
      { to: '/subscriptions', icon: <CreditCard size={16} />, label: 'Subscriptions' },
      { to: '/campaigns', icon: <Megaphone size={16} />, label: 'Campaigns' },
      { to: '/leads', icon: <Target size={16} />, label: 'Leads' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: <Shield size={16} />, label: 'Settings' },
    ]
  }
]

export default function Sidebar({ userCount }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h2>CreatorsHQ</h2>
          <span>Admin Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.to === '/users' && userCount > 0 && (
                  <span className="nav-badge">{userCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-badge">
          <div className="admin-avatar">{initials}</div>
          <div className="admin-info">
            <p>{user?.email || 'admin@creatorshq.ai'}</p>
            <span>Super Admin</span>
          </div>
        </div>
        <button
          className="nav-item btn-ghost"
          style={{ width: '100%', marginTop: 8, border: 'none', background: 'transparent' }}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
