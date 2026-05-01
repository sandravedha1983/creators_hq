import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("Token captured, redirecting to dashboard...");
      localStorage.setItem("token", token);
      // Hard reload ensures the root AuthContext picks up the new token
      window.location.href = "/dashboard";
    } else {
      console.warn("No token found in URL, redirecting to login.");
      navigate("/login");
    }
  }, []);

  return <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-heaven-muted font-bold tracking-widest text-xs uppercase animate-pulse">Establishing Secure Neural Link...</p>
  </div>;
};

export default DashboardRedirect;
