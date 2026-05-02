import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/services/authService";

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { tokenLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("[AUTH] Token found, initializing session...");
      localStorage.setItem("token", token);
      
      // Let AuthContext handle the profile fetch after navigation
      navigate("/dashboard", { replace: true });
      
      // Optional: force a refresh if the app state is sticky
      window.location.reload();
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <div>Signing you in...</div>;
}
