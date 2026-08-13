import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { registerUser, loginUser, getProfile, sendOTP, resendOTP, verifyOTP as verifyOTPService, adminLogin as adminLoginService } from '@/services/authService';
import { updateUserProfile } from '@/services/profileService';
import { toast } from 'react-hot-toast';

export type UserRole = 'creator' | 'brand' | 'admin';

interface User {
    id?: string;
    email: string;
    name?: string;
    role: UserRole;
    plan?: 'free' | 'pro';
    isOnboarded?: boolean;
    niche?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    verificationStatus?: "not_submitted" | "pending" | "verified" | "rejected";
    verificationCode?: string;
    socials?: {
        instagram?: { url?: string; username?: string; verified?: boolean };
        youtube?: { url?: string; username?: string; verified?: boolean };
        linkedin?: { url?: string; username?: string; verified?: boolean };
        twitter?: { url?: string; username?: string; verified?: boolean };
    };
    socialHandle?: string;
    instagram?: {
        isConnected?: boolean;
        username?: string;
        profileLink?: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isVerified: boolean;
    isInitializing: boolean;
    otp: string | null;
    login: (email: string, password?: string) => Promise<void>;
    adminLogin: (email: string, password?: string) => Promise<void>;
    signup: (email: string, name: string, role: UserRole, password?: string) => Promise<void>;
    verifyOtp: (otp: string) => Promise<boolean>;
    tokenLogin: (token: string, userData: User) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    resendOtp: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const { addUser } = useAppContext();

    useEffect(() => {
        const storedUser = localStorage.getItem('creatorshq_user');
        const storedAuth = localStorage.getItem('creatorshq_auth');
        const token = localStorage.getItem('token');
        const isVerifiedLocal = localStorage.getItem('creatorshq_verified') === 'true';

        if (token) {
            getProfile().then(response => {
                const userData = response.data;
                setUser(userData);
                setIsAuthenticated(true);
                setIsVerified(true);
                localStorage.setItem('creatorshq_user', JSON.stringify(userData));
                localStorage.setItem('creatorshq_auth', 'true');
                localStorage.setItem('creatorshq_verified', 'true');
                if (userData.role) {
                    localStorage.setItem('role', userData.role);
                }
                setIsInitializing(false);
            }).catch(() => {
                // Token is invalid/expired
                setUser(null);
                setIsAuthenticated(false);
                setIsVerified(false);
                localStorage.removeItem('token');
                localStorage.removeItem('creatorshq_user');
                localStorage.removeItem('creatorshq_auth');
                localStorage.removeItem('creatorshq_verified');
                localStorage.removeItem('role');
                setIsInitializing(false);
                if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                    window.location.href = '/login';
                }
            });
        } else if (storedUser && storedAuth === 'true' && !isVerifiedLocal) {
            // User logged in but hasn't verified OTP yet (no token yet)
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setIsVerified(false);
            setIsInitializing(false);
        } else {
            // Clean up stale state if no token and not in OTP flow
            localStorage.removeItem('creatorshq_user');
            localStorage.removeItem('creatorshq_auth');
            localStorage.removeItem('creatorshq_verified');
            setIsInitializing(false);
        }

        const handleAuthExpired = () => {
            // Clear all auth state
            setUser(null);
            setIsAuthenticated(false);
            setIsVerified(false);
            localStorage.removeItem('token');
            localStorage.removeItem('creatorshq_user');
            localStorage.removeItem('creatorshq_auth');
            localStorage.removeItem('creatorshq_verified');
            localStorage.removeItem('role');
            // Redirect to login
            window.location.href = '/login';
        };
        window.addEventListener('auth:expired', handleAuthExpired);
        
        return () => {
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, []);

    const login = async (email: string, password?: string) => {
        try {
            const response = await loginUser({ email, password: password || 'password123' });
            const userToLogin: User = { 
                email: response.user.email, 
                name: response.user.name, 
                role: response.user.role as UserRole,
            };

            setUser(userToLogin);
            setIsAuthenticated(true);
            setIsVerified(false);

            localStorage.setItem('creatorshq_user', JSON.stringify(userToLogin));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'false');
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const adminLogin = async (email: string, password?: string) => {
        try {
            const response = await adminLoginService({ email, password });
            const adminUser: User = { 
                email: response.user.email, 
                role: 'admin',
                name: 'Administrator'
            };

            setUser(adminUser);
            setIsAuthenticated(true);
            setIsVerified(true);

            localStorage.setItem('creatorshq_user', JSON.stringify(adminUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'true');
        } catch (error) {
            console.error("Admin Login failed:", error);
            throw error;
        }
    };

    const signup = async (email: string, name: string, role: UserRole, password?: string) => {
        try {
            await registerUser({ email, name, role, password: password || 'password123' });
            
            const newUser: User = { 
                email, 
                name, 
                role
            };
            setUser(newUser);
            addUser(newUser);
            setIsAuthenticated(true);
            setIsVerified(false);
            
            localStorage.setItem('creatorshq_user', JSON.stringify(newUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'false');
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    };

    const verifyOtp = async (inputOtp: string): Promise<boolean> => {
        if (!user?.email) return false;
        try {
            const data = await verifyOTPService(user.email, inputOtp);

            if (data.success) {
                if (data.token) localStorage.setItem('token', data.token);
                // Persist role and full user data returned by verifyOTP
                if (data.user) {
                    const fullUser: User = { ...user, ...data.user };
                    setUser(fullUser);
                    localStorage.setItem('creatorshq_user', JSON.stringify(fullUser));
                    localStorage.setItem('role', data.user.role || user.role);
                }
                setIsVerified(true);
                localStorage.setItem('creatorshq_verified', 'true');
                return true;
            }
            return false;
        } catch (error) {
            console.error("OTP Verification Error:", error);
            return false;
        }
    };

    const tokenLogin = async (token: string, userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsVerified(true);
        localStorage.setItem('token', token);
        localStorage.setItem('creatorshq_user', JSON.stringify(userData));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'true');
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsVerified(false);
        localStorage.removeItem('token');
        localStorage.removeItem('creatorshq_user');
        localStorage.removeItem('creatorshq_auth');
        localStorage.removeItem('creatorshq_verified');
        localStorage.removeItem('role');
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        try {
            // Call the backend to persist name/avatar/onboarding changes
            const apiPayload: Record<string, any> = {};
            if (data.name !== undefined) apiPayload.name = data.name;
            if (data.avatar !== undefined) apiPayload.avatar = data.avatar;
            if (data.isOnboarded !== undefined) apiPayload.isOnboarded = data.isOnboarded;

            if (Object.keys(apiPayload).length > 0) {
                await updateUserProfile(apiPayload);
            }

            // Merge into local state regardless
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('creatorshq_user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('[AuthContext] updateProfile API error:', err);
            // Still update local state so UI doesn't break
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('creatorshq_user', JSON.stringify(updatedUser));
        }
    };

    const resendOtp = async (): Promise<boolean> => {
        if (!user?.email) {
            toast.error("Session identity missing.");
            return false;
        }
        try {
            const response = await resendOTP(user.email);
            if (response.success) {
                toast.success('New verification code sent');
                return true;
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to resend code");
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isVerified, isInitializing, otp: null, login, adminLogin, signup, verifyOtp, tokenLogin, logout, updateProfile, resendOtp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
