import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Spinner } from "@/components/ui/Spinner";

const roleRedirects: Record<string, string> = {
  creator: "/creator-dashboard",
  brand: "/brand-dashboard",
  admin: "/admin/dashboard",
};

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initSession = async () => {
      try {
        if (!isSupabaseConfigured()) throw new Error("Supabase authentication is not configured.");

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No Supabase session was created.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_blocked, is_suspended")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile || !["creator", "brand", "admin"].includes(profile.role)) {
          throw new Error("An authoritative account profile is required.");
        }
        if (profile.is_blocked || profile.is_suspended) {
          throw new Error("This account is suspended or blocked.");
        }

        if (active) navigate(roleRedirects[profile.role] || "/dashboard", { replace: true });
      } catch (sessionError) {
        if (!active) return;
        console.error("[AUTH] Session redirect failed:", sessionError);
        await supabase.auth.signOut();
        setError("Authentication failed. Redirecting to login...");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    };

    void initSession();
    return () => {
      active = false;
    };
  }, [navigate]);

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
