// Lightweight API client bound to the backend
import axios from 'axios'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/api/auth/')) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────
export const login = async (email, password) => {
  // If Supabase is configured, attempt Supabase Auth first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data?.session) {
        return {
          data: {
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              role: data.user.user_metadata?.role || 'admin'
            }
          }
        }
      }
    } catch {
      // Fall through to backend admin login
    }
  }
  return api.post('/api/auth/admin-login', { email, password })
}

// ── Admin — Users ──────────────────────────────────────
export const getUsers = () => api.get('/api/admin/users')
export const blockUser = (id) => api.patch(`/api/admin/user/${id}/block`)
export const deleteUser = (id) => api.delete(`/api/admin/user/${id}`)

// ── Admin — Campaigns ─────────────────────────────────
export const getCampaigns = () => api.get('/api/admin/campaigns')

// ── Admin — Leads ─────────────────────────────────────
export const getLeads = () => api.get('/api/admin/leads')

// ── Admin — Feedback & Moderation ─────────────────────
export const getFeedback = () => api.get('/api/feedback')
export const updateFeedback = (id, status) => api.patch(`/api/feedback/${id}`, { status })

// ── Billing ───────────────────────────────────────────
export const getBillingHistory = () => api.get('/api/billing/history')

// ── Analytics ─────────────────────────────────────────
export const getAnalytics = () => api.get('/api/analytics')

// ── Health ────────────────────────────────────────────
export const getHealth = () => api.get('/health')

export default api
