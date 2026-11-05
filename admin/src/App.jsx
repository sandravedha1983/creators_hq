import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import CampaignsPage from './pages/CampaignsPage'
import LeadsPage from './pages/LeadsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import { getUsers } from './api'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      getUsers().then(r => setUserCount((r.data.data || []).length)).catch(() => {})
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="admin-layout">
      <Sidebar userCount={userCount} />
      <main className="main-content">
        <Routes>
          <Route path="/"              element={<DashboardPage />} />
          <Route path="/users"         element={<UsersPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/campaigns"     element={<CampaignsPage />} />
          <Route path="/leads"         element={<LeadsPage />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*"    element={<ProtectedLayout />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
