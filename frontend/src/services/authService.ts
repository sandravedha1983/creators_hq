import API from "./api";

export const registerUser = async (data: any) => {
    try {
        const res = await API.post("/api/auth/register", data);
        return res.data;
    } catch (err: any) {
        throw err.response?.data || err;
    }
};

export const loginUser = async (data: any) => {
    try {
        const res = await API.post("/api/auth/login", data);
        if (res.data.token) {
            localStorage.setItem("token", res.data.token);
        }
        return res.data;
    } catch (err: any) {
        throw err.response?.data || err;
    }
};

export const adminLogin = async (data: any) => {
    try {
        const res = await API.post("/api/auth/admin-login", data);
        if (res.data.token) {
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", "admin");
        }
        return res.data;
    } catch (err: any) {
        throw err.response?.data || err;
    }
};

export const getProfile = async () => {
    const res = await API.get("/api/auth/profile");
    return res.data;
};

export const sendOTP = async (email: string) => {
    const res = await API.post("/api/auth/send-otp", { email });
    return res.data;
};

export const verifyOTP = async (email: string, otp: string) => {
    try {
        const res = await API.post("/api/auth/verify-otp", { email, otp });
        if (res.data.token) {
            localStorage.setItem("token", res.data.token);
        }
        return res.data;
    } catch (err: any) {
        throw err.response?.data || err;
    }
};

export const resendOTP = async (email: string) => {
    const res = await API.post("/api/auth/resend-otp", { email });
    return res.data;
};

export const submitVerification = async (formData: FormData) => {
    const res = await API.post("/api/verify/submit", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};

export const getVerificationStatus = async () => {
    const res = await API.get("/api/verify/status");
    return res.data;
};
