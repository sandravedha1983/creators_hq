import API from "../services/api";

export const verifyCreator = async (profileLink: string) => {
    const res = await API.post("/api/verify", { profileLink });
    return res.data;
};

export const checkVerification = async (profileLink: string, code: string) => {
    const res = await API.post("/api/verify/check", { profileLink, code });
    return res.data;
};

export const getDashboardData = async () => {
    const res = await API.get("/api/dashboard");
    return res.data;
};

export const connectPlatform = async (platform: string) => {
    const res = await API.post("/api/integrations/connect", { platform });
    return res.data;
};

export const getIntegrations = async () => {
    const res = await API.get("/api/integrations");
    return res.data;
};

export const testBackend = async () => {
    const res = await API.get("/api/test");
    return res.data;
};
