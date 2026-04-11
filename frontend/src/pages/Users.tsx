import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Filter, Shield, UserPlus, MoreHorizontal, User, Trash2, Edit3, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/utils/cn';

export default function Users() {
    const { users, deleteUser, updateUser } = useAppContext();
    const [search, setSearch] = useState('');

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
                        <Zap className="w-4 h-4 text-neon-purple animate-pulse" />
                        Identity Database: <span className="text-neon-purple font-black ml-1">{users.length} Nodes</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="glass" className="h-16 px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:text-white border-white/5 shadow-2xl">
                        Export Logs
                    </Button>
                    <Button variant="neon" onClick={() => console.log('Provisioning flow coming soon...')} className="h-16 px-10 rounded-[2rem] gap-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-neon-purple/20 hover:scale-105 transition-all">
                        <UserPlus className="w-5 h-5" />
                        Provision Node
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <Card className="flex-1 p-4 bg-white/5 border border-white/5 backdrop-blur-xl rounded-[2.5rem] flex items-center gap-6 group focus-within:ring-2 focus-within:ring-neon-purple/20 transition-all shadow-2xl">
                    <Search className="w-6 h-6 text-white/10 ml-6 group-focus-within:text-neon-purple transition-all" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search identity by name or email..."
                        className="border-0 bg-transparent shadow-none h-14 px-0 focus-visible:ring-0 flex-1 text-white font-bold placeholder:text-white/10"
                    />
                </Card>
                <div className="flex gap-4">
                    <Button variant="glass" className="h-16 px-10 rounded-[1.5rem] border-white/5 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all shadow-2xl">
                        <Filter className="w-5 h-5 mr-4 text-neon-purple" />
                        Role Matrix
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-[4rem] border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />
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
                                <tr key={user.email} className="group hover:bg-white/5 transition-all">
                                    <td className="px-12 py-10">
                                        <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/10 group-hover:text-neon-purple group-hover:bg-neon-purple/10 group-hover:border-neon-purple/20 shadow-2xl transition-all mx-auto">
                                            <User className="w-8 h-8" />
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="space-y-4">
                                            <p className="font-black text-white text-lg tracking-tight uppercase leading-none">{user.name || 'ANON-NODE'}</p>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className="w-2 h-2 bg-neon-blue rounded-full opacity-30" />
                                                {user.email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className={cn(
                                            "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-block shadow-2xl border",
                                            user.role === 'admin' ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/20 shadow-neon-pink/10' :
                                                user.role === 'brand' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20 shadow-neon-blue/10' :
                                                    'bg-neon-purple/10 text-neon-purple border-neon-purple/20 shadow-neon-purple/10'
                                        )}>
                                            {user.role} Access
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                        <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => updateUser(user.email, { status: 'Updated' })}
                                                className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/30 transition-all shadow-2xl"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to purge ${user.email} from the registry?`)) {
                                                        deleteUser(user.email);
                                                    }
                                                }}
                                                className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 hover:border-neon-pink/30 transition-all shadow-2xl"
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
            </div>
        </div>
    );
}
