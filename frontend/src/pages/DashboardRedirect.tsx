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
      navigate("/dashboard");
    } else {
      console.warn("No token found in URL, redirecting to login.");
      navigate("/login");
    }
  }, []);

  return <div>Logging you in...</div>;
};

export default DashboardRedirect;
