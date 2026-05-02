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
      localStorage.setItem("token", token);
      
      // Fetch profile to update AuthContext immediately before navigating
      getProfile().then(res => {
          tokenLogin(token, res.data);
          navigate("/dashboard", { replace: true });
      }).catch(() => {
          navigate("/login", { replace: true });
      });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, tokenLogin]);

  return <div>Signing you in...</div>;
}
