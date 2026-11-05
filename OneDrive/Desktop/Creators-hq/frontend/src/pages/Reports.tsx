import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Activity, ShieldAlert, Zap, Shield, Search, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function Reports() {
    return (
        <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight mb-2">Insights & Reports</h1>
                    <p className="text-heaven-muted text-xs font-bold mt-4 uppercase tracking-[0.4em] flex items-center gap-3 opacity-50">
                        <Shield className="w-4 h-4 text-primary animate-pulse" />
                        Professional Performance Audits
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="px-10 h-16 rounded-[2.25rem] border-white/10 text-heaven-muted hover:text-heaven-text">
                        Export Data
                    </Button>
                    <Button variant="primary" className="px-10 h-16 rounded-[2.25rem] gap-4 shadow-soft-glow">
                        <Download className="w-5 h-5" />
                        Run New Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Security Score', value: '--/100', icon: ShieldAlert, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'System Uptime', value: '00.0%', icon: Activity, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
                    { label: 'Network Latency', value: '--- ms', icon: Activity, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
                    { label: 'System Health', value: 'Awaiting', icon: Zap, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                ].map((stat, i) => (
                    <Card key={i} className="p-8 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[2.5rem] flex flex-col items-center text-center gap-6 shadow-glass relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 transition-colors duration-700" />
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-3 relative z-10", stat.bg, stat.color)}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.3em] mb-2 opacity-50">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-heaven-text tracking-tight">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between px-10">
                    <h3 className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40">Report Archive</h3>
                    <div className="flex gap-10">
                        <div className="flex items-center gap-4 text-heaven-muted/40 uppercase font-bold text-[9px] tracking-[0.2em] italic">
                            <Activity className="w-4 h-4" />
                            Awaiting System Signals
                        </div>
                    </div>
                </div>

                <Card className="p-20 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[3.5rem] flex flex-col items-center justify-center text-center gap-10 shadow-glass">
                    <div className="w-24 h-24 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] flex items-center justify-center text-heaven-muted/10 shadow-glass">
                        <FileText className="w-12 h-12" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-4">
                        <h4 className="text-2xl font-bold text-heaven-text tracking-tight uppercase">Null Archive</h4>
                        <p className="text-[10px] font-bold text-heaven-muted uppercase tracking-[0.4em] opacity-40 leading-loose">Initialize your first performance audit to populate your archival vault.</p>
                    </div>
                    <Button variant="secondary" className="px-10 h-16 rounded-[2rem] bg-white/[0.02] border-white/10 text-heaven-muted/60 hover:text-heaven-text transition-all mt-4">
                         Request Access Key
                    </Button>
                </Card>
            </div>
        </div>
    );
}
