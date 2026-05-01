import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { registerUser, loginUser, getProfile, sendOTP, resendOTP } from '@/services/authService';
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
            // If we have a token but no user data, we should fetch the profile
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
                verificationStatus: response.user.verificationStatus || 'not_submitted',
                verificationCode: response.user.verificationCode
            };

            setUser(userToLogin);
            setIsAuthenticated(true);
            setIsVerified(false);

            // Trigger real backend OTP
            await sendOTP(email, ""); // We don't need to pass OTP anymore, backend handles it

            localStorage.setItem('creatorshq_user', JSON.stringify(userToLogin));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'false');
        } catch (error) {
            console.error("Login failed:", error);
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
            
            // Trigger real backend OTP
            await sendOTP(email, "");

            localStorage.setItem('creatorshq_user', JSON.stringify(newUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'false');
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    };

    const verifyOtp = async (inputOtp: string): Promise<boolean> => {
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user?.email, otp: inputOtp })
            });
            const data = await res.json();

            if (data.success) {
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
        setIsVerified(true); // OAuth users are pre-verified
        localStorage.setItem('token', token);
        localStorage.setItem('creatorshq_user', JSON.stringify(userData));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'true');
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsVerified(false);
        localStorage.removeItem('creatorshq_user');
        localStorage.removeItem('creatorshq_auth');
        localStorage.removeItem('creatorshq_verified');
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
            toast.error("Session identity missing. Please try signing up again.");
            return false;
        }
        try {
            console.log(`[CREATORSHQ AUTH] Requesting OTP resend for: ${user.email}`);
            const response = await resendOTP(user.email);
            if (response.success) {
                toast.success('New verification code sent to your email');
                return true;
            }
        } catch (error: any) {
            console.error("[CREATORSHQ AUTH] Resend OTP Error:", error);
            const message = error.response?.data?.message || "Verification flux failed to resend";
            toast.error(message);
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isVerified, isInitializing, otp: null, login, signup, verifyOtp, tokenLogin, logout, updateProfile, resendOtp }}>
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
