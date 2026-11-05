import { useEffect, useState, useMemo } from 'react'
import { getUsers, blockUser, deleteUser } from '../api'
import { useToast } from '../context/ToastContext'
import Topbar from '../components/Topbar'
import {
  UserCheck, UserX, Trash2, Search,
  Filter, ChevronLeft, ChevronRight, Shield, Users
} from 'lucide-react'

const PAGE_SIZE = 10

const avatarColors = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#ec4899']
const colorFor = (str = '') => avatarColors[str.charCodeAt(0) % avatarColors.length]

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await getUsers()
      setUsers(res.data.data || [])
    } catch {
      toast('Failed to load users', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchPlan = planFilter === 'all' || u.plan === planFilter
      return matchSearch && matchRole && matchPlan
    })
  }, [users, search, roleFilter, planFilter])

  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBlock = async (u) => {
    setActionLoading(u._id + '_block')
    try {
      await blockUser(u._id)
      toast(`User ${u.isBlocked ? 'unblocked' : 'blocked'} successfully`, 'success')
      fetchUsers()
    } catch {
      toast('Failed to update user status', 'error')
    }
    setActionLoading(null)
  }

  const handleDelete = async (u) => {
    setActionLoading(u._id + '_delete')
    try {
      await deleteUser(u._id)
      toast('User deleted successfully', 'success')
      setConfirmDelete(null)
      fetchUsers()
    } catch {
      toast('Failed to delete user', 'error')
    }
    setActionLoading(null)
  }

  return (
    <>
      <Topbar
        title="User Management"
        subtitle={`${users.length} total users registered`}
        onRefresh={fetchUsers}
        loading={loading}
      />

      <div className="page-content">
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'All Users', value: users.length, color: 'var(--accent-light)' },
            { label: 'Creators', value: users.filter(u => u.role === 'creator').length, color: 'var(--info)' },
            { label: 'Brands', value: users.filter(u => u.role === 'brand').length, color: 'var(--success)' },
            { label: 'Blocked', value: users.filter(u => u.isBlocked).length, color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '16px 20px' }}>
              <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ marginBottom: 0 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="card">
          <div className="card-header">
            <Users size={16} color="var(--accent-light)" />
            <h3>All Users</h3>

            <div className="filters-bar" style={{ marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', height: 34 }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: 160, fontFamily: 'inherit' }}
                  placeholder="Search users…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>

              <select className="form-select" style={{ height: 34, width: 'auto', padding: '0 10px' }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
                <option value="all">All Roles</option>
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
                <option value="admin">Admin</option>
              </select>

              <select className="form-select" style={{ height: 34, width: 'auto', padding: '0 10px' }} value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}>
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state">
                <Users size={36} />
                <p>No users match your filters.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: colorFor(u.name) }}>
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-accent' : u.role === 'brand' ? 'badge-success' : 'badge-info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.plan === 'pro' ? 'badge-accent' : 'badge-muted'}`}>
                          {u.plan || 'free'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          u.verificationStatus === 'verified' ? 'badge-success' :
                          u.verificationStatus === 'pending' ? 'badge-warning' :
                          u.verificationStatus === 'rejected' ? 'badge-danger' :
                          'badge-muted'
                        }`}>
                          {u.verificationStatus || 'not_submitted'}
                        </span>
                      </td>
                      <td>
                        {u.isBlocked
                          ? <span className="badge badge-danger"><UserX size={10} /> Blocked</span>
                          : <span className="badge badge-success"><UserCheck size={10} /> Active</span>
                        }
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className={`btn btn-sm ${u.isBlocked ? 'btn-warning' : 'btn-warning'}`}
                            onClick={() => handleBlock(u)}
                            disabled={actionLoading === u._id + '_block'}
                            title={u.isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            {actionLoading === u._id + '_block' ? '…' : u.isBlocked ? <><UserCheck size={12} /> Unblock</> : <><UserX size={12} /> Block</>}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setConfirmDelete(u)}
                            title="Delete user"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.name}</strong> ({confirmDelete.email})? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete._id + '_delete'}
              >
                <Trash2 size={14} />
                {actionLoading === confirmDelete._id + '_delete' ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
