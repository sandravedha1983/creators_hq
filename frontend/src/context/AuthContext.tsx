import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { registerUser, loginUser, getProfile, sendOTP, resendOTP, verifyOTP as verifyOTPService, adminLogin as adminLoginService } from '@/services/authService';
import { toast } from 'react-hot-toast';

export type UserRole = 'creator' | 'brand' | 'admin';

interface User {
    email: string;
    name?: string;
    role: UserRole;
    niche?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    verificationStatus?: "not_submitted" | "pending" | "verified" | "rejected";
    verificationCode?: string;
    socials?: {
        instagram?: string;
        youtube?: string;
        linkedin?: string;
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
    updateProfile: (data: Partial<User>) => void;
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

        if (storedUser && storedAuth === 'true') {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setIsVerified(localStorage.getItem('creatorshq_verified') === 'true');
            setIsInitializing(false);
        } else if (token) {
            getProfile().then(response => {
                const userData = response.data;
                setUser(userData);
                setIsAuthenticated(true);
                setIsVerified(true);
                localStorage.setItem('creatorshq_user', JSON.stringify(userData));
                localStorage.setItem('creatorshq_auth', 'true');
                localStorage.setItem('creatorshq_verified', 'true');
                setIsInitializing(false);
            }).catch(() => {
                localStorage.removeItem('token');
                setIsInitializing(false);
            });
        } else {
            setIsInitializing(false);
        }

        const handleAuthExpired = () => {
            logout();
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

    const updateProfile = (data: Partial<User>) => {
        if (user) {
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
