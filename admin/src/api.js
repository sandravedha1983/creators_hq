// Lightweight API client bound to the backend
import axios from 'axios'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  if (isSupabaseConfigured()) {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      void supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const getUsers = () => api.get('/api/admin/users')
export const blockUser = (id) => api.patch(`/api/admin/user/${id}/block`)
export const deleteUser = (id) => api.delete(`/api/admin/user/${id}`)
export const getCampaigns = () => api.get('/api/admin/campaigns')
export const getLeads = () => api.get('/api/admin/leads')
export const getFeedback = () => api.get('/api/feedback')
export const updateFeedback = (id, status) => api.patch(`/api/feedback/${id}`, { status })
export const getBillingHistory = () => api.get('/api/billing/history')
export const getAnalytics = () => api.get('/api/analytics')
export const getHealth = () => api.get('/health')

export default api
