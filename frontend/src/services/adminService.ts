import API from "./api";

export const getAllUsers = async () => {
    const res = await API.get("/api/admin/users");
    return res.data;
};

export const deleteUser = async (id: string) => {
    const res = await API.delete(`/api/admin/user/${id}`);
    return res.data;
};

export const blockUser = async (id: string) => {
    const res = await API.patch(`/api/admin/user/${id}/block`);
    return res.data;
};
