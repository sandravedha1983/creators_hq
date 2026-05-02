import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Filter, Shield, UserPlus, User, Trash2, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getAllUsers, deleteUser, blockUser } from '@/services/adminService';
import { toast } from 'react-hot-toast';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await getAllUsers();
            if (res.success) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id);
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleBlock = async (id: string) => {
        try {
            const res = await blockUser(id);
            toast.success(res.message || "Status updated");
            fetchUsers();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tight uppercase">User Registry</h1>
                    <p className="text-white/30 text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        Identity Database: <span className="text-primary font-black ml-1">{users.length} Nodes</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <Card className="flex-1 p-4 bg-white/5 border border-white/5 backdrop-blur-xl rounded-[2.5rem] flex items-center gap-6 group focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xl">
                    <Search className="w-6 h-6 text-white/10 ml-6 group-focus-within:text-primary transition-all" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search identity by name or email..."
                        className="border-0 bg-transparent shadow-none h-14 px-0 focus-visible:ring-0 flex-1 text-white font-bold placeholder:text-white/10"
                    />
                </Card>
            </div>

            <div className="overflow-hidden rounded-[4rem] border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />
                
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-heaven-muted">Scanning Matrix...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse relative z-10">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-12 py-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] text-center w-32">Avatar</th>
                                <th className="px-12 py-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Identity Details</th>
                                <th className="px-12 py-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Status</th>
                                <th className="px-12 py-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-12 py-32 text-center text-white/10 font-black uppercase text-[11px] tracking-[0.5em]">
                                        No identity matches detected in current matrix
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, i) => (
                                    <tr key={user._id} className="group hover:bg-white/5 transition-all">
                                        <td className="px-12 py-10">
                                            <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/10 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 shadow-2xl transition-all mx-auto">
                                                <User className="w-8 h-8" />
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-black text-white text-lg tracking-tight uppercase leading-none">{user.name || 'ANON-NODE'}</p>
                                                    {user.isBlocked && <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded-full border border-red-500/30">Blocked</span>}
                                                </div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-primary rounded-full opacity-30" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className={cn(
                                                "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-block shadow-2xl border",
                                                user.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    user.role === 'brand' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-primary/10 text-primary border-primary/20'
                                            )}>
                                                {user.role} Access
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleBlock(user._id)}
                                                    title={user.isBlocked ? "Unblock User" : "Block User"}
                                                    className={cn(
                                                        "p-4 bg-white/5 border border-white/5 rounded-2xl transition-all shadow-2xl",
                                                        user.isBlocked ? "text-green-500 hover:bg-green-500/10 hover:border-green-500/30" : "text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/30"
                                                    )}
                                                >
                                                    <ShieldAlert className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-2xl"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
