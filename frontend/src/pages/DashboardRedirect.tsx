import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProfile } from "@/services/authService";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { tokenLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initSession = async () => {
      try {
        // 1. Check for Supabase session first
        if (isSupabaseConfigured()) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (session?.user && !sessionError) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            const role = profile?.role === 'admin' || session.user.app_metadata?.role === 'admin'
              ? 'admin'
              : profile?.role === 'brand' ? 'brand' : 'creator';
            const roleRedirects: Record<string, string> = {
              creator: "/creator-dashboard",
              brand: "/brand-dashboard",
              admin: "/admin/dashboard",
            };
            navigate(roleRedirects[role] || "/dashboard", { replace: true });
            return;
          }
        }

        // 2. Check for URL query param ?token=
        const params = new URLSearchParams(window.location.search);
        let token = params.get("token");

        // 3. Check for URL hash #access_token=
        if (!token && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          token = hashParams.get("access_token");
        }

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        // Store token so API client uses it
        localStorage.setItem("token", token);

        // Fetch user profile from backend
        const response = await getProfile();
        if (!active) return;
        const userData = response.data;

        await tokenLogin(token, {
          id: userData.id || userData._id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          verificationStatus: userData.verificationStatus,
          socials: userData.socials,
        });

        const roleRedirects: Record<string, string> = {
          creator: "/creator-dashboard",
          brand: "/brand-dashboard",
          admin: "/admin/dashboard",
        };
        navigate(roleRedirects[userData.role] || "/dashboard", { replace: true });
      } catch (err) {
        if (!active) return;
        console.error("[AUTH] Session redirect failed:", err);
        localStorage.removeItem("token");
        setError("Authentication failed. Redirecting to login...");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      }
    };

    initSession();

    return () => {
      active = false;
    };
  }, [navigate, tokenLogin]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-center">
        <div className="space-y-4">
          <p className="text-rose-400 text-sm font-bold">{error}</p>
          <p className="text-heaven-muted text-xs">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <Spinner />;
}
