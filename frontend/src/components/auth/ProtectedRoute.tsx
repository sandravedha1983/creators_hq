import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isVerified, user, isInitializing } = useAuth();
    const location = useLocation();

    if (isInitializing) {
        return <div className="min-h-screen bg-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if they try to access another role's area
        const roleRedirects: Record<string, string> = {
            creator: '/creator-dashboard',
            brand: '/brand-dashboard',
            admin: '/admin-dashboard'
        };
        return <Navigate to={roleRedirects[user.role]} replace />;
    }

    return <>{children}</>;
};
