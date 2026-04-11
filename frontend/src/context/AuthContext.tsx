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
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isVerified: boolean;
    otp: string | null;
    login: (email: string, password?: string) => Promise<void>;
    signup: (email: string, name: string, role: UserRole, password?: string) => Promise<void>;
    verifyOtp: (otp: string) => boolean;
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
    const [otp, setOtp] = useState<string | null>(null);
    const { addUser } = useAppContext();

    useEffect(() => {
        const storedUser = localStorage.getItem('creatorshq_user');
        const storedAuth = localStorage.getItem('creatorshq_auth');
        const storedVerified = localStorage.getItem('creatorshq_verified');

        if (storedUser && storedAuth === 'true') {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setIsVerified(storedVerified === 'true');
        }
    }, []);

    const generateOtp = async (email?: string) => {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setOtp(newOtp);
        
        const targetEmail = email || user?.email;
        if (targetEmail) {
            try {
                await sendOTP(targetEmail, newOtp);
            } catch (error) {
                console.error("Failed to send OTP email:", error);
            }
        }
        
        console.log(`[CREATORSHQ AUTH] Verification code: ${newOtp}`);
        return newOtp;
    };

    const login = async (email: string, password?: string) => {
        try {
            // If no password provided, it might be a demo login or we need to handle it.
            // For real backend connection, we need the password.
            if (!password) {
                console.warn("Login called without password, using demo fallback if applicable");
            }

            const response = await loginUser({ email, password: password || 'password123' });
            const userToLogin: User = { 
                email: response.user.email, 
                name: response.user.name, 
                role: response.user.role as UserRole,
                verificationStatus: response.user.verificationStatus,
                verificationCode: response.user.verificationCode
            };

            setUser(userToLogin);
            setIsAuthenticated(true);
            setIsVerified(false); // Still require OTP simulation if requested
            generateOtp();

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
            
            const newUser: User = { email, name, role };
            setUser(newUser);
            addUser(newUser);
            setIsAuthenticated(true);
            setIsVerified(false);
            generateOtp();

            localStorage.setItem('creatorshq_user', JSON.stringify(newUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'false');
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    };

    const verifyOtp = (inputOtp: string): boolean => {
        if (inputOtp === otp && otp !== null) {
            setIsVerified(true);
            localStorage.setItem('creatorshq_verified', 'true');
            return true;
        }
        return false;
    };

    const tokenLogin = async (token: string, userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsVerified(false);
        generateOtp();
        localStorage.setItem('token', token);
        localStorage.setItem('creatorshq_user', JSON.stringify(userData));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'false');
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsVerified(false);
        setOtp(null);
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
                setOtp(response.otp);
                toast.success('New verification code sent to your email');
                console.log(`[CREATORSHQ AUTH] Resend successful. New code: ${response.otp}`);
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
        <AuthContext.Provider value={{ user, isAuthenticated, isVerified, otp, login, signup, verifyOtp, tokenLogin, logout, updateProfile, resendOtp }}>
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
