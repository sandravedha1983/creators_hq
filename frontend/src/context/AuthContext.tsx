import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
    registerUser,
    loginUser,
    getProfile,
    adminLogin as adminLoginService
} from '@/services/authService';
import { updateUserProfile } from '@/services/profileService';
import { toast } from 'react-hot-toast';

export type UserRole = 'creator' | 'brand' | 'admin';

export interface User {
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
    login: (email: string, password?: string) => Promise<{ requiresVerification: boolean; role?: UserRole }>;
    adminLogin: (email: string, password?: string) => Promise<void>;
    signup: (email: string, name: string, role: UserRole, password?: string) => Promise<void>;
    signInWithOAuth: (provider: 'google' | 'linkedin') => Promise<void>;
    verifyOtp: (otp: string) => Promise<boolean>;
    tokenLogin: (token: string, userData: User) => Promise<void>;
    logout: () => Promise<void>;
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

    // Helper: Sync session from Supabase User & Profiles Table
    const syncSupabaseProfile = useCallback(async (sbUser: any, token: string): Promise<UserRole> => {
        let resolvedRole: UserRole = 'creator';
        try {
            localStorage.setItem('token', token);
            let profileData: any = null;

            if (isSupabaseConfigured()) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sbUser.id)
                    .single();
                if (profile) profileData = profile;
            }

            const role: UserRole = profileData?.role === 'admin' || sbUser.app_metadata?.role === 'admin'
                ? 'admin'
                : profileData?.role === 'brand' ? 'brand' : 'creator';
            resolvedRole = role;
            const mappedUser: User = {
                id: sbUser.id,
                email: sbUser.email || '',
                name: profileData?.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
                role,
                plan: profileData?.plan || 'free',
                isOnboarded: profileData?.is_onboarded ?? false,
                avatar: profileData?.avatar || '',
                verificationStatus: profileData?.verification_status || 'not_submitted',
                socials: profileData?.socials || {}
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
            setIsVerified(true);

            localStorage.setItem('creatorshq_user', JSON.stringify(mappedUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'true');
            localStorage.setItem('role', role);
        } catch (err) {
            console.error('[AUTH SYNC ERROR]', err);
        }
        return resolvedRole;
    }, []);

    // 1. Session Initialization (Supabase Auth first, then stored token)
    useEffect(() => {
        let active = true;

        const initializeAuth = async () => {
            if (isSupabaseConfigured()) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user && active) {
                        await syncSupabaseProfile(session.user, session.access_token);
                        setIsInitializing(false);
                        return;
                    }
                } catch (e) {
                    console.warn('[SUPABASE SESSION INIT]', e);
                }
            }

            // Fallback: Check local storage token & backend profile
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('creatorshq_user');
            const isVerifiedLocal = localStorage.getItem('creatorshq_verified') === 'true';

            if (token) {
                try {
                    const res = await getProfile();
                    if (active && res?.data) {
                        const userData = res.data;
                        const formattedUser: User = {
                            id: userData.id || userData._id,
                            email: userData.email,
                            name: userData.name,
                            role: userData.role as UserRole,
                            plan: userData.plan || 'free',
                            isOnboarded: userData.isOnboarded || false,
                            avatar: userData.avatar || '',
                            verificationStatus: userData.verificationStatus,
                            socials: userData.socials
                        };
                        setUser(formattedUser);
                        setIsAuthenticated(true);
                        setIsVerified(true);
                        localStorage.setItem('creatorshq_user', JSON.stringify(formattedUser));
                        localStorage.setItem('creatorshq_auth', 'true');
                        localStorage.setItem('creatorshq_verified', 'true');
                        localStorage.setItem('role', formattedUser.role);
                    }
                } catch {
                    if (active) {
                        setUser(null);
                        setIsAuthenticated(false);
                        setIsVerified(false);
                        localStorage.removeItem('token');
                        localStorage.removeItem('creatorshq_user');
                        localStorage.removeItem('creatorshq_auth');
                        localStorage.removeItem('creatorshq_verified');
                        localStorage.removeItem('role');
                    }
                }
            } else if (storedUser && !isVerifiedLocal) {
                try {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                    setIsVerified(false);
                } catch {
                    // Ignore JSON parse error
                }
            }

            if (active) setIsInitializing(false);
        };

        initializeAuth();

        // Supabase Auth State Change Listener
        let authSubscription: any = null;
        if (isSupabaseConfigured()) {
            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    await syncSupabaseProfile(session.user, session.access_token);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsVerified(false);
                    localStorage.removeItem('token');
                    localStorage.removeItem('creatorshq_user');
                    localStorage.removeItem('creatorshq_auth');
                    localStorage.removeItem('creatorshq_verified');
                    localStorage.removeItem('role');
                }
            });
            authSubscription = data.subscription;
        }

        const handleAuthExpired = () => {
            setUser(null);
            setIsAuthenticated(false);
            setIsVerified(false);
            localStorage.removeItem('token');
            localStorage.removeItem('creatorshq_user');
            localStorage.removeItem('creatorshq_auth');
            localStorage.removeItem('creatorshq_verified');
            localStorage.removeItem('role');

            const path = window.location.pathname;
            if (path !== '/login' && path !== '/signup') {
                window.location.href = '/login';
            }
        };
        window.addEventListener('auth:expired', handleAuthExpired);

        return () => {
            active = false;
            window.removeEventListener('auth:expired', handleAuthExpired);
            if (authSubscription) authSubscription.unsubscribe();
        };
    }, [syncSupabaseProfile]);

    // 2. Login Flow (Supabase native with backend fallback)
    const login = useCallback(async (email: string, password?: string) => {
        const pass = password || 'password123';

        // Try Supabase Auth first if configured
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (!error && data?.user && data.session) {
                const role = await syncSupabaseProfile(data.user, data.session.access_token);
                return { requiresVerification: false, role };
            }
        }

        // Fallback to Express backend auth
        const response = await loginUser({ email, password: pass });
        const needsVerification = response.requiresVerification || !response.token;

        if (needsVerification) {
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
            return { requiresVerification: true, role: response.user.role };
        } else {
            const userToLogin: User = {
                id: response.user.id || response.user._id,
                email: response.user.email,
                name: response.user.name,
                role: response.user.role as UserRole,
                avatar: response.user.avatar || '',
                isOnboarded: response.user.isOnboarded || false
            };

            setUser(userToLogin);
            setIsAuthenticated(true);
            setIsVerified(true);

            if (response.token) localStorage.setItem('token', response.token);
            localStorage.setItem('creatorshq_user', JSON.stringify(userToLogin));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'true');
            if (response.user.role) localStorage.setItem('role', response.user.role);

            return { requiresVerification: false, role: response.user.role };
        }
    }, [syncSupabaseProfile]);

    // 3. Admin Login
    const adminLogin = useCallback(async (email: string, password?: string) => {
        try {
            // Try Supabase Auth first
            if (isSupabaseConfigured()) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
                if (!error && data?.user && data.session) {
                    await syncSupabaseProfile(data.user, data.session.access_token);
                    return;
                }
            }

            // Fallback to Express backend admin endpoint
            const response = await adminLoginService({ email, password });
            const adminUser: User = {
                id: 'admin',
                email: response.user.email,
                role: 'admin',
                name: 'Administrator',
                plan: 'pro',
                isOnboarded: true
            };

            setUser(adminUser);
            setIsAuthenticated(true);
            setIsVerified(true);

            if (response.token) localStorage.setItem('token', response.token);
            localStorage.setItem('creatorshq_user', JSON.stringify(adminUser));
            localStorage.setItem('creatorshq_auth', 'true');
            localStorage.setItem('creatorshq_verified', 'true');
            localStorage.setItem('role', 'admin');
        } catch (error) {
            console.error("Admin Login failed:", error);
            throw error;
        }
    }, [syncSupabaseProfile]);

    // 4. Signup Flow (Supabase native with backend fallback)
    const signup = useCallback(async (email: string, name: string, role: UserRole, password?: string) => {
        const pass = password || 'password123';
        const signupRole: UserRole = role === 'brand' ? 'brand' : 'creator';

        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: { name, role: signupRole }
                }
            });

            if (error) throw error;

            if (data?.user) {
                const newUser: User = {
                    id: data.user.id,
                    email,
                    name,
                    role: signupRole,
                    plan: 'free',
                    isOnboarded: false
                };

                setUser(newUser);
                addUser(newUser);

                if (data.session) {
                    await syncSupabaseProfile(data.user, data.session.access_token);
                } else {
                    // Requires email confirmation
                    setIsAuthenticated(true);
                    setIsVerified(false);
                    localStorage.setItem('creatorshq_user', JSON.stringify(newUser));
                    localStorage.setItem('creatorshq_auth', 'true');
                    localStorage.setItem('creatorshq_verified', 'false');
                }
                return;
            }
        }

        // Fallback to Express backend
        await registerUser({ email, name, role: signupRole, password: pass });
        const newUser: User = { email, name, role: signupRole };
        setUser(newUser);
        addUser(newUser);
        setIsAuthenticated(true);
        setIsVerified(false);

        localStorage.setItem('creatorshq_user', JSON.stringify(newUser));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'false');
    }, [addUser, syncSupabaseProfile]);

    // 5. Social OAuth Login
    const signInWithOAuth = useCallback(async (provider: 'google' | 'linkedin') => {
        if (isSupabaseConfigured()) {
            const redirectUrl = `${window.location.origin}/dashboard-redirect`;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: redirectUrl
                }
            });
            if (error) throw error;
            return;
        }

        // Fallback
        const baseURL = import.meta.env.VITE_API_URL || "";
        window.location.href = `${baseURL}/api/auth/${provider}`;
    }, []);

    // 6. Verify OTP
    const verifyOtp = useCallback(async (inputOtp: string): Promise<boolean> => {
        if (!user?.email || !isSupabaseConfigured()) return false;

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: user.email,
                token: inputOtp,
                type: 'signup'
            });

            if (error) throw error;

            if (data.user && data.session) {
                await syncSupabaseProfile(data.user, data.session.access_token);
                setIsVerified(true);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[SUPABASE OTP ERROR]', error);
            return false;
        }
    }, [user, syncSupabaseProfile]);

    // 7. Token Login (OAuth Callback)
    const tokenLogin = useCallback(async (token: string, userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsVerified(true);
        localStorage.setItem('token', token);
        localStorage.setItem('creatorshq_user', JSON.stringify(userData));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'true');
        if (userData.role) localStorage.setItem('role', userData.role);
    }, []);

    // 8. Logout
    const logout = useCallback(async () => {
        if (isSupabaseConfigured()) {
            try {
                await supabase.auth.signOut();
            } catch {
                // Ignore signOut error
            }
        }
        setUser(null);
        setIsAuthenticated(false);
        setIsVerified(false);
        localStorage.removeItem('token');
        localStorage.removeItem('creatorshq_user');
        localStorage.removeItem('creatorshq_auth');
        localStorage.removeItem('creatorshq_verified');
        localStorage.removeItem('role');
    }, []);

    // 9. Update Profile
    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!user) return;
        try {
            // Update Supabase profiles table directly if active
            if (isSupabaseConfigured() && user.id) {
                const updates: any = {};
                if (data.name !== undefined) updates.name = data.name;
                if (data.avatar !== undefined) updates.avatar = data.avatar;
                if (data.isOnboarded !== undefined) updates.is_onboarded = data.isOnboarded;
                if (data.socialHandle !== undefined) updates.social_handle = data.socialHandle;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('profiles').update(updates).eq('id', user.id);
                }
            }

            // Sync with backend API
            const apiPayload: Record<string, any> = {};
            if (data.name !== undefined) apiPayload.name = data.name;
            if (data.avatar !== undefined) apiPayload.avatar = data.avatar;
            if (data.isOnboarded !== undefined) apiPayload.isOnboarded = data.isOnboarded;

            if (Object.keys(apiPayload).length > 0) {
                await updateUserProfile(apiPayload);
            }

            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('creatorshq_user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('[AuthContext] updateProfile error:', err);
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('creatorshq_user', JSON.stringify(updatedUser));
        }
    }, [user]);

    // 10. Resend OTP
   const resendOtp = useCallback(async (): Promise<boolean> => {
        if (!user?.email || !isSupabaseConfigured()) {
            toast.error('Session identity missing.');
            return false;
        }

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email
            });

            if (error) throw error;

            toast.success('New verification code sent');
            return true;
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
            return false;
     }
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isVerified,
            isInitializing,
            otp: null,
            login,
            adminLogin,
            signup,
            signInWithOAuth,
            verifyOtp,
            tokenLogin,
            logout,
            updateProfile,
            resendOtp
        }}>
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
