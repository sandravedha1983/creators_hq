import API from "./api";

export const registerUser = async (data: any) => {
    try {
        const res = await API.post("/auth/register", data);
        return res.data;
    } catch (err: any) {
        console.error(err.response?.data || err.message);
        throw err;
    }
};

export const loginUser = async (data: any) => {
    try {
        const res = await API.post("/auth/login", data);
        if (res.data.token) {
            localStorage.setItem("token", res.data.token);
        }
        return res.data;
    } catch (err: any) {
        console.error(err.response?.data || err.message);
        throw err;
    }
};

export const getProfile = async () => {
    const res = await API.get("/auth/profile");
    return res.data;
};

export const sendOTP = async (email: string, otp: string) => {
    await API.post("/auth/send-otp", { email, otp });
};

export const resendOTP = async (email: string) => {
    const res = await API.post("/auth/resend-otp", { email });
    return res.data;
};

export const submitVerification = async (formData: FormData) => {
    const res = await API.post("/verification/submit", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};

export const getVerificationStatus = async () => {
    const res = await API.get("/verification/status");
    return res.data;
};
