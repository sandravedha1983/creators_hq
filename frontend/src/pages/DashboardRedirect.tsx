import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/services/authService";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { tokenLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const initSession = async () => {
      try {
        // 1. Store the token first so the API interceptor can use it
        localStorage.setItem("token", token);

        // 2. Fetch the full user profile from backend
        const response = await getProfile();
        const userData = response.data;

        // 3. Initialize auth context with token + user data
        await tokenLogin(token, {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          verificationStatus: userData.verificationStatus,
          socials: userData.socials,
        });

        // 4. Navigate based on role
        const roleRedirects: Record<string, string> = {
          creator: "/creator-dashboard",
          brand: "/brand-dashboard",
          admin: "/admin-dashboard",
        };
        navigate(roleRedirects[userData.role] || "/dashboard", { replace: true });
      } catch (err) {
        console.error("[AUTH] OAuth session init failed:", err);
        localStorage.removeItem("token");
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    };

    initSession();
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
