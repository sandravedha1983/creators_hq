import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Bell, CheckCheck,
    Zap, ShoppingBag, MessageSquare,
    Server, Activity as ActivityIcon, Users
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";
import API from "@/services/api";
import { MEMBERSHIP_UI_ENABLED } from '@/config/planVisibility';

interface NotificationItem {
    id: string;
    title?: string;
    message: string;
    type: string;
    read: boolean;
    created_at?: string;
    createdAt?: string;
}

export default function Notifications() {
    const { activities, markActivitiesRead } = useAppContext();
    const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [filter, setFilter] = useState<'all' | 'collaboration' | 'campaign' | 'system'>('all');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/notifications');
            if (!res.data?.success) throw new Error('Notification service returned an unsuccessful response.');
            const notifications = res.data.data || [];
            setLiveNotifications(notifications);
            setUnreadCount(notifications.filter((n: NotificationItem) =>
                (MEMBERSHIP_UI_ENABLED || n.type !== 'billing') && !n.read
            ).length);
            setLoadError(false);
        } catch (error) {
            console.error('[Notifications] Server notifications unavailable', error);
            setLoadError(true);
            const notifications = activities.map(a => ({
                id: a.id,
                title: a.title ?? a.message,
                message: a.message,
                type: a.type,
                read: a.read,
                created_at: a.timestamp
            }));
            setLiveNotifications(notifications);
            setUnreadCount(notifications.filter(n =>
                (MEMBERSHIP_UI_ENABLED || n.type !== 'billing') && !n.read
            ).length);
        } finally {
            setLoading(false);
        }
    }, [activities]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await API.patch('/api/notifications/read-all');
            setLiveNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            markActivitiesRead();
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('[Notifications] Failed to mark all as read', error);
            toast.error('Unable to update notifications. Please try again.');
        }
    };

    const handleMarkSingleRead = async (id: string) => {
        try {
            await API.patch(`/api/notifications/${id}/read`);
            setLiveNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (error) {
            console.error('[Notifications] Failed to mark notification as read', error);
            toast.error('Unable to update notification. Please try again.');
        }
    };

    const displayList = !loadError
        ? liveNotifications.filter(n =>
            (MEMBERSHIP_UI_ENABLED || n.type !== 'billing') && (filter === 'all' || n.type === filter)
        )
        : activities.filter(a =>
            (MEMBERSHIP_UI_ENABLED || a.type !== 'billing') && (filter === 'all' || a.type === filter)
        ).map(a => ({
            id: a.id,
            title: a.title ?? a.message,
            message: a.message,
            type: a.type,
            read: a.read,
            created_at: a.timestamp
        }));

    const getIcon = (type: string) => {
        switch (type) {
            case 'campaign':
            case 'application': return <ShoppingBag className="w-5 h-5" />;
            case 'collaboration': return <Users className="w-5 h-5" />;
            case 'message': return <MessageSquare className="w-5 h-5" />;
            case 'billing': return <Zap className="w-5 h-5" />;
            case 'system': return <Server className="w-5 h-5" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'campaign':
            case 'application': return 'text-primary bg-primary/10 border-primary/20 shadow-soft-glow';
            case 'collaboration': return 'text-secondary bg-secondary/10 border-secondary/20 shadow-soft-glow';
            case 'message': return 'text-secondary bg-secondary/10 border-secondary/20 shadow-soft-glow';
            case 'billing': return 'text-accent bg-accent/10 border-accent/20 shadow-soft-glow';
            default: return 'text-primary bg-primary/10 border-primary/20 shadow-soft-glow';
        }
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div>
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase flex items-center gap-8 cursor-default">
                        Recent Activity
                        <div className="flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-primary text-xl font-bold text-white shadow-soft-glow animate-pulse">
                            {unreadCount}
                        </div>
                    </h1>
                    <p className="text-heaven-muted text-[10px] font-bold mt-6 uppercase tracking-[0.4em] flex items-center gap-4 opacity-60">
                        <ActivityIcon className="w-4 h-4 text-primary animate-pulse" />
                        {loading ? 'Loading notification history' : loadError ? 'Showing local activity · server unavailable' : 'Notification history · refreshed on page load'}
                    </p>
                </div>
                <Button
                    onClick={handleMarkAllRead}
                    variant="primary"
                    className="h-16 px-12 rounded-[2.25rem] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 shadow-soft-glow transition-all"
                >
                    <CheckCheck className="w-5 h-5 shadow-sm" />
                    Mark All Seen
                </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-center">
                {[
                    { key: 'all', label: 'All Alerts' },
                    { key: 'collaboration', label: 'Collaborations' },
                    { key: 'campaign', label: 'Campaigns' },
                    { key: 'system', label: 'System' }
                ].map((f) => (
                    <Button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={cn(
                            "h-14 px-10 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all border shadow-glass",
                            filter === f.key ? 'bg-primary text-white border-primary/20 shadow-soft-glow' : 'bg-white/[0.04] text-heaven-muted border-white/[0.08] hover:bg-white/[0.08] hover:text-heaven-text'
                        )}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {displayList.length > 0 ? (
                        displayList.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => !item.read && handleMarkSingleRead(item.id)}
                            >
                                <Card className={cn(
                                    "p-8 border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] flex items-center gap-8 group hover:border-white/[0.12] transition-all shadow-glass overflow-hidden relative cursor-pointer",
                                    item.read ? 'bg-white/[0.02] opacity-50 hover:opacity-80' : 'bg-white/[0.06] border-l-4 border-l-primary shadow-soft-glow'
                                )}>
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border", getColor(item.type))}>
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold text-heaven-text uppercase tracking-tight">{item.title}</h3>
                                            <span className="text-[10px] text-heaven-muted uppercase tracking-widest font-bold opacity-40">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-heaven-muted leading-relaxed font-medium">{item.message}</p>
                                    </div>
                                    {!item.read && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0 shadow-soft-glow" />
                                    )}
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-24 text-center space-y-4">
                            <Bell className="w-12 h-12 text-heaven-muted/20 mx-auto" />
                            <p className="text-xs font-bold uppercase tracking-widest text-heaven-muted/40">No alerts in this category</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
