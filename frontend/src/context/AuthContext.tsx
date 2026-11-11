import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { updateUserProfile } from '@/services/profileService';

export type UserRole = 'creator' | 'brand' | 'admin';

export interface User {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    plan?: 'free' | 'pro';
    isOnboarded?: boolean;
    niche?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    verificationStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
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
    login: (email: string, password: string) => Promise<{ requiresVerification: boolean; role?: UserRole }>;
    adminLogin: (email: string, password: string) => Promise<void>;
    signup: (email: string, name: string, role: UserRole, password: string) => Promise<void>;
    signInWithOAuth: (provider: 'google' | 'linkedin') => Promise<void>;
    verifyOtp: (otp: string) => Promise<boolean>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    resendOtp: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase authentication is not configured.');
    }
};

const clearAuthState = () => {
    localStorage.removeItem('creatorshq_user');
    localStorage.removeItem('creatorshq_auth');
    localStorage.removeItem('creatorshq_verified');
    localStorage.removeItem('role');
};
const notifyAuthChanged = () => window.dispatchEvent(new Event('auth:changed'));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const syncSupabaseProfile = useCallback(async (sbUser: SupabaseUser): Promise<User> => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .single();

        if (error) throw error;
        if (!profile || !['creator', 'brand', 'admin'].includes(profile.role)) {
            throw new Error('An authoritative account profile is required.');
        }
        if (profile.is_blocked || profile.is_suspended) {
            await supabase.auth.signOut();
            throw new Error('Your account is suspended or blocked. Please contact support.');
        }

        const mappedUser: User = {
            id: sbUser.id,
            email: sbUser.email || profile.email || '',
            name: profile.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
            role: profile.role,
            plan: profile.plan || 'free',
            isOnboarded: profile.is_onboarded,
            avatar: profile.avatar || '',
            verificationStatus: profile.verification_status || 'not_submitted',
            verificationCode: profile.verification_code || '',
            socialHandle: profile.social_handle || '',
            socials: profile.socials || {}
        };

        setUser(mappedUser);
        setIsAuthenticated(true);
        setIsVerified(true);
        localStorage.setItem('creatorshq_user', JSON.stringify(mappedUser));
        localStorage.setItem('creatorshq_auth', 'true');
        localStorage.setItem('creatorshq_verified', 'true');
        localStorage.setItem('role', mappedUser.role);
        notifyAuthChanged();
        return mappedUser;
    }, []);

    useEffect(() => {
        let active = true;

        const initializeAuth = async () => {
            try {
                if (isSupabaseConfigured()) {
                    const { data, error } = await supabase.auth.getSession();
                    if (error) throw error;
                    if (data.session?.user) {
                        await syncSupabaseProfile(data.session.user);
                    }
                }
            } catch (error) {
                console.error('[AUTH SESSION INIT]', error);
                if (active) {
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsVerified(false);
                    clearAuthState();
                    notifyAuthChanged();
                }
            } finally {
                if (active) setIsInitializing(false);
            }
        };

        void initializeAuth();

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
                setIsVerified(false);
                clearAuthState();
                notifyAuthChanged();
                return;
            }

            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
                void syncSupabaseProfile(session.user).catch(error => {
                    console.error('[AUTH PROFILE SYNC]', error);
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsVerified(false);
                    clearAuthState();
                    notifyAuthChanged();
                });
            }
        });

        const handleAuthExpired = () => {
            void supabase.auth.signOut();
            if (!['/login', '/signup'].includes(window.location.pathname)) {
                window.location.href = '/login';
            }
        };
        window.addEventListener('auth:expired', handleAuthExpired);

        return () => {
            active = false;
            data.subscription.unsubscribe();
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, [syncSupabaseProfile]);

    const login = useCallback(async (email: string, password: string) => {
        requireSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user || !data.session) throw new Error('Supabase did not create an authenticated session.');
        const profile = await syncSupabaseProfile(data.user);
        return { requiresVerification: false, role: profile.role };
    }, [syncSupabaseProfile]);

    const adminLogin = useCallback(async (email: string, password: string) => {
        requireSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user || !data.session) throw new Error('Supabase did not create an authenticated session.');
        const profile = await syncSupabaseProfile(data.user);
        if (profile.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('This account is not authorized for admin access.');
        }
    }, [syncSupabaseProfile]);

    const signup = useCallback(async (email: string, name: string, role: UserRole, password: string) => {
        requireSupabase();
        if (role === 'admin') throw new Error('Administrator accounts cannot be created through public signup.');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role },
                emailRedirectTo: `${window.location.origin}/dashboard-redirect`
            }
        });
        if (error) throw error;
        if (!data.user) throw new Error('Supabase did not create an account.');

        if (data.session) {
            await syncSupabaseProfile(data.user);
            return;
        }

        setUser({ id: data.user.id, email, name, role, plan: 'free', isOnboarded: false });
        setIsAuthenticated(false);
        setIsVerified(false);
        notifyAuthChanged();
    }, [syncSupabaseProfile]);

    const signInWithOAuth = useCallback(async (provider: 'google' | 'linkedin') => {
        requireSupabase();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider === 'linkedin' ? 'linkedin_oidc' : 'google',
            options: { redirectTo: `${window.location.origin}/dashboard-redirect` }
        });
        if (error) throw error;
    }, []);

    const verifyOtp = useCallback(async (inputOtp: string): Promise<boolean> => {
        requireSupabase();
        if (!user?.email) return false;
        const { data, error } = await supabase.auth.verifyOtp({
            email: user.email,
            token: inputOtp,
            type: 'signup'
        });
        if (error) throw error;
        if (!data.user || !data.session) return false;
        await syncSupabaseProfile(data.user);
        return true;
    }, [syncSupabaseProfile, user?.email]);

    const resetPassword = useCallback(async (email: string) => {
        requireSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
    }, []);

    const updatePassword = useCallback(async (password: string) => {
        requireSupabase();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Password reset session is invalid or expired.');

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    }, []);

    const resendOtp = useCallback(async (): Promise<boolean> => {
        requireSupabase();
        if (!user?.email) throw new Error('Signup email is not available.');
        const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
        if (error) throw error;
        return true;
    }, [user?.email]);

    const logout = useCallback(async () => {
        requireSupabase();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }, []);

    const updateProfile = useCallback(async (updates: Partial<User>) => {
        if (!user) throw new Error('User is not authenticated.');
        const payload: { name?: string; avatar?: string; isOnboarded?: boolean; socialHandle?: string } = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.avatar !== undefined) payload.avatar = updates.avatar;
        if (updates.isOnboarded !== undefined) payload.isOnboarded = updates.isOnboarded;
        if (updates.socialHandle !== undefined) payload.socialHandle = updates.socialHandle;

        if (Object.keys(payload).length > 0) {
            await updateUserProfile(payload);
        }

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('creatorshq_user', JSON.stringify(updatedUser));
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
            resetPassword,
            updatePassword,
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
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
