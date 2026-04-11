import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getProfile } from '@/services/authService';
import { toast } from 'react-hot-toast';

export default function DashboardRedirect() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { tokenLogin } = useAuth();

    useEffect(() => {
        const handleRedirect = async () => {
            const token = searchParams.get('token');
            if (token) {
                try {
                    localStorage.setItem('token', token); // Set temporarily for getProfile
                    const response = await getProfile();
                    const userData = response.data;
                    
                    await tokenLogin(token, {
                        email: userData.email,
                        name: userData.name,
                        role: userData.role,
                        avatar: userData.avatar,
                        niche: userData.niche,
                        bio: userData.bio,
                        location: userData.location,
                        socials: userData.socials
                    });

                    toast.success('Neural Link Established. Verify Access Code.');
                    navigate('/verify-otp');
                } catch (error) {
                    console.error('OAuth Redirect Error:', error);
                    toast.error('Neural Link Interrupted');
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };

        handleRedirect();
    }, [searchParams, navigate, tokenLogin]);

    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-8">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-soft-glow" />
            <div className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.5em] animate-pulse">
                Establishing Neural Link...
            </div>
        </div>
    );
}
