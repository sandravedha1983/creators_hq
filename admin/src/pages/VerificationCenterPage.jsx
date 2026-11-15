import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Eye, FileText, Search, ShieldCheck } from 'lucide-react'
import { getVerificationSummary, getVerificationRequests, getVerificationRequest, deleteVerificationDocument, decideVerificationRequest } from '../api'
import { useToast } from '../context/ToastContext'
import Topbar from '../components/Topbar'

const STATUSES = [
  'pending',
  'under_review',
  'additional_information_required',
  'verified',
  'rejected',
  'suspended'
]

const ACTIONS = [
  { status: 'under_review', label: 'Start review', reason: false },
  { status: 'additional_information_required', label: 'Request information', reason: true },
  { status: 'verified', label: 'Approve', reason: false },
  { status: 'rejected', label: 'Reject', reason: true },
  { status: 'suspended', label: 'Suspend account', reason: true }
]

const displayStatus = (status) => status.replaceAll('_', ' ')

export default function VerificationCenterPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [summary, setSummary] = useState({})
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('pending')
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryResponse, requestResponse] = await Promise.all([
        getVerificationSummary(),
        getVerificationRequests({
        status,
        role: role === 'all' ? undefined : role,
        search,
        page,
        limit: 20
        })
      ])
      setSummary(summaryResponse.data.data || {})
      setRequests(requestResponse.data.data || [])
      setTotal(requestResponse.data.pagination?.total || 0)
    } catch (error) {
      toast(error.response?.data?.message || 'Could not load verification requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [status, role, search, page, toast])

  useEffect(() => { void loadRequests() }, [loadRequests])

  const openRequest = async (id) => {
    try {
      const { data } = await getVerificationRequest(id)
      setSelected(data.data)
    } catch (error) {
      toast(error.response?.data?.message || 'Could not open this application', 'error')
    }
  }

  const performDecision = async () => {
    if (!selected || !action) return
    if (action.reason && !reason.trim()) {
      toast('A reason is required for this decision', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await decideVerificationRequest(selected.id, {
        status: action.status,
        reason: reason.trim(),
        adminNotes: adminNotes.trim()
      })
      toast(data.notificationDelivered === false
        ? 'Decision saved; user notification could not be delivered.'
        : 'Verification decision recorded.', data.notificationDelivered === false ? 'error' : 'success')
      setAction(null)
      setReason('')
      setAdminNotes('')
      await Promise.all([loadRequests(), openRequest(selected.id)])
    } catch (error) {
      toast(error.response?.data?.message || 'Could not save this decision', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeDocument = async (document) => {
    if (!selected || !window.confirm(`Permanently delete ${document.document_name}?`)) return
    setDeletingDocument(document.id)
    try {
      await deleteVerificationDocument(selected.id, document.id)
      toast('Private document deleted.', 'success')
      await openRequest(selected.id)
    } catch (error) {
      toast(error.response?.data?.message || 'Could not delete the document', 'error')
    } finally {
      setDeletingDocument(null)
    }
  }

  const canDecide = selected && ['pending', 'under_review', 'additional_information_required', 'verified'].includes(selected.status)
  const availableActions = selected?.status === 'pending'
    ? ACTIONS
    : selected?.status === 'additional_information_required'
      ? ACTIONS
      : selected?.status === 'verified'
        ? ACTIONS.filter(item => item.status === 'suspended')
        : ACTIONS.filter(item => item.status !== 'under_review')
  const pages = Math.max(1, Math.ceil(total / 20))

  return (
    <>
      <Topbar
        title="Verification Center"
        subtitle="Review Creator and Brand applications. Automated screening never approves accounts."
        onRefresh={loadRequests}
        loading={loading}
      />
      <div className="page-content">
        <div className="stats-grid">
          {[
            { label: 'Pending', icon: <Clock size={17} />, status: 'pending' },
            { label: 'Under review', icon: <Eye size={17} />, status: 'under_review' },
            { label: 'More information', icon: <AlertTriangle size={17} />, status: 'additional_information_required' },
            { label: 'Verified', icon: <CheckCircle size={17} />, status: 'verified' },
            { label: 'Rejected', icon: <AlertTriangle size={17} />, status: 'rejected' },
            { label: 'Suspended', icon: <AlertTriangle size={17} />, status: 'suspended' }
          ].map(item => (
            <button key={item.status} className="stat-card" onClick={() => { setStatus(item.status); setPage(1) }}>
              <div className="stat-icon">{item.icon}</div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{summary[item.status] || 0}</div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap' }}>
            <ShieldCheck size={17} color="var(--accent-light)" />
            <h3>Applications</h3>
            <div className="filters-bar" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <label className="search-field">
                <Search size={14} />
                <input value={search} placeholder="Search applicants" onChange={event => { setSearch(event.target.value); setPage(1) }} />
              </label>
              <select className="form-select" value={role} onChange={event => { setRole(event.target.value); setPage(1) }}>
                <option value="all">All account types</option>
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
              </select>
              <select className="form-select" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}>
                {STATUSES.map(value => <option key={value} value={value}>{displayStatus(value)}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
              <table>
                <thead><tr><th>Applicant</th><th>Account</th><th>Status</th><th>Screening</th><th>Submitted</th><th /></tr></thead>
                <tbody>
                  {requests.map(request => (
                    <tr key={request.id}>
                      <td>
                        <div className="user-name">{request.profile?.name || request.application_data.full_name || request.application_data.company_name}</div>
                        <div className="user-email">{request.profile?.email || request.application_data.business_email}</div>
                      </td>
                      <td>{request.account_role}</td>
                      <td><span className="badge badge-warning">{displayStatus(request.status)}</span></td>
                      <td>{request.screening_result?.flags?.length || 0} flag(s)</td>
                      <td>{new Date(request.submitted_at).toLocaleString()}</td>
                      <td><button className="btn btn-sm btn-primary" onClick={() => openRequest(request.id)}>Review</button></td>
                    </tr>
                  ))}
                  {!requests.length && <tr><td colSpan="6">No applications in this queue.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
          {pages > 1 && <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className="page-btn" disabled={page >= pages} onClick={() => setPage(current => current + 1)}>Next</button>
          </div>}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <section className="modal verification-modal" role="dialog" aria-modal="true" aria-label="Verification application" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selected.profile?.name || selected.application_data.full_name || selected.application_data.company_name}</h3>
                <p>{selected.profile?.email || selected.application_data.business_email} · {selected.account_role}</p>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="verification-details">
              <section>
                <h4>Application details</h4>
                <dl>{Object.entries(selected.application_data || {}).map(([key, value]) => (
                  <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value || '—')}</dd></div>
                ))}</dl>
              </section>
              <section>
                <h4>Automated screening</h4>
                <p>{selected.screening_result?.outcome || 'No screening result available'}</p>
                <ul>{(selected.screening_result?.flags || []).map(flag => <li key={flag}>{flag.replaceAll('_', ' ')}</li>)}</ul>
                <p className="muted">Website accessibility and identity ownership are not automatically verified.</p>
              </section>
              <section>
                <h4>Private supporting documents</h4>
                {(selected.documents || []).map(document => (
                  <div key={document.id} className="document-row">
                    <a className="document-link" href={document.signed_url} target="_blank" rel="noreferrer">
                      <FileText size={15} /> {document.document_name} ({Math.ceil(document.file_size / 1024)} KB)
                    </a>
                    <button className="btn btn-sm btn-danger" disabled={deletingDocument === document.id} onClick={() => removeDocument(document)}>
                      {deletingDocument === document.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ))}
                {!selected.documents?.length && <p>No documents attached.</p>}
              </section>
              <section>
                <h4>Decision history</h4>
                {(selected.history || []).map(entry => (
                  <div className="history-item" key={entry.id}>
                    <strong>{entry.action.replaceAll('_', ' ')}</strong>
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                    {entry.details?.reason && <p>{entry.details.reason}</p>}
                  </div>
                ))}
                {!selected.history?.length && <p>No prior actions recorded.</p>}
              </section>
              {selected.admin_notes && (
                <section>
                  <h4>Private Admin notes</h4>
                  <p>{selected.admin_notes}</p>
                </section>
              )}
            </div>
            {canDecide && (
              <div className="verification-actions">
                {availableActions.map(item => (
                  <button
                    key={item.status}
                    className={`btn btn-sm ${item.status === 'verified' ? 'btn-primary' : item.status === 'rejected' || item.status === 'suspended' ? 'btn-danger' : 'btn-warning'}`}
                    onClick={() => setAction(item)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {action && (
        <div className="modal-overlay" onClick={() => !saving && setAction(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-label={`${action.label} confirmation`} onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h3>{action.label}</h3></div>
            {action.reason && <label className="form-label">
              Decision reason (visible to the applicant)
              <textarea className="form-input" value={reason} onChange={event => setReason(event.target.value)} maxLength={2000} required />
            </label>}
            <label className="form-label">
              Private Admin notes (not shown to the applicant)
              <textarea className="form-input" value={adminNotes} onChange={event => setAdminNotes(event.target.value)} maxLength={5000} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-ghost" disabled={saving} onClick={() => setAction(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving || (action.reason && !reason.trim())} onClick={performDecision}>
                {saving ? 'Saving…' : 'Confirm decision'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
