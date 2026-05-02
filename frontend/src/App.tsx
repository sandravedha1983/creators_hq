import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { cn } from './utils/cn'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LandingPage } from './pages/LandingPage'
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { Spinner } from './components/ui/Spinner';

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));
const VerificationPage = lazy(() => import('./pages/auth/VerificationPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CRM = lazy(() => import('./pages/CRM'));
const Content = lazy(() => import('./pages/Content'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect'));
const Automation = lazy(() => import('./pages/Automation'));
const Billing = lazy(() => import('./pages/Billing'));
const Profile = lazy(() => import('./pages/Profile'));
const AIStudio = lazy(() => import('./pages/AIStudio'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Team = lazy(() => import('./pages/Team'));

const BrandDashboard = lazy(() => import('./pages/BrandDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Creators = lazy(() => import('./pages/Creators'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));

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
                <Suspense fallback={<Spinner />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/admin-login" element={<AdminLogin />} />
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
                </Suspense>
            </div>
        </Router>
    );
}

export default App
