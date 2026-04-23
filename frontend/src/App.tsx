import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { cn } from './utils/cn'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LandingPage } from './pages/LandingPage'
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import VerifyOtp from './pages/auth/VerifyOtp'
import VerificationPage from './pages/auth/VerificationPage'
import Dashboard from './pages/Dashboard'
import CRM from './pages/CRM'
import Content from './pages/Content'
import Marketplace from './pages/Marketplace'
import Analytics from './pages/Analytics'
import DashboardRedirect from './pages/DashboardRedirect'
import Automation from './pages/Automation'
import Billing from './pages/Billing'
import Profile from './pages/Profile'
import AIStudio from './pages/AIStudio'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Integrations from './pages/Integrations'
import Team from './pages/Team'

import { Sidebar } from './components/layout/Sidebar'
import { Navbar } from './components/layout/Navbar'
import BrandDashboard from './pages/BrandDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Campaigns from './pages/Campaigns'
import Creators from './pages/Creators'
import Users from './pages/Users'
import Reports from './pages/Reports'

// Layout component to wrap dashboards with Sidebar & Navbar
import { motion } from "framer-motion";


function App() {
    return (
        <Router>
            <div className="min-h-screen bg-dark text-heaven-text font-sans selection:bg-primary/20 selection:text-white">
                <Toaster 
                    position="top-right" 
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(15, 23, 42, 0.8)',
                            color: '#E5E7EB',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '1.25rem',
                            padding: '12px 24px',
                            fontSize: '14px',
                        },
                    }} 
                />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard-redirect" element={<DashboardRedirect />} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />

                    {/* Auth Verification */}
                    <Route path="/verify-otp" element={<ProtectedRoute><VerifyOtp /></ProtectedRoute>} />
                    <Route path="/verify-account" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />

                    {/* Creator Specific Routes */}
                    <Route path="/creator-dashboard" element={<ProtectedRoute allowedRoles={['creator']}><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/crm" element={<ProtectedRoute allowedRoles={['creator']}><DashboardLayout><CRM /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/content" element={<ProtectedRoute allowedRoles={['creator']}><DashboardLayout><Content /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['creator']}><DashboardLayout><Marketplace /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/ai-studio" element={<ProtectedRoute allowedRoles={['creator']}><DashboardLayout><AIStudio /></DashboardLayout></ProtectedRoute>} />

                    {/* Brand Specific Routes */}
                    <Route path="/brand-dashboard" element={<ProtectedRoute allowedRoles={['brand']}><DashboardLayout><BrandDashboard /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/campaigns" element={<ProtectedRoute allowedRoles={['brand']}><DashboardLayout><Campaigns /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/creators" element={<ProtectedRoute allowedRoles={['brand']}><DashboardLayout><Creators /></DashboardLayout></ProtectedRoute>} />

                    {/* Admin Specific Routes */}
                    <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />

                    {/* Shared Functional Hubs */}
                    <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/automation" element={<ProtectedRoute><DashboardLayout><Automation /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><DashboardLayout><Messages /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/integrations" element={<ProtectedRoute><DashboardLayout><Integrations /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><DashboardLayout><Team /></DashboardLayout></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App
