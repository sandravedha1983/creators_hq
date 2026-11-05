import API from "./api";

export const getBrandDashboard = async () => {
    try {
        const res = await API.get("/api/dashboard/brand");
        return res.data;
    } catch (err: any) {
        console.error(err.response?.data || err.message);
        throw err;
    }
};

export const getCreatorDashboard = async () => {
    try {
        const res = await API.get("/api/dashboard/creator");
        return res.data;
    } catch (err: any) {
        console.error(err.response?.data || err.message);
        throw err;
    }
};
