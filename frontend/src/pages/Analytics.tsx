import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';
import { BarChart3, TrendingUp, Users, Zap, ArrowUpRight, ArrowDownRight, Download, Calendar, Activity } from 'lucide-react';

export default function Analytics() {
    return (
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-heaven-text tracking-tight uppercase leading-none">Performance Analytics</h1>
                    <p className="text-heaven-muted font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-4 opacity-60">
                       <Activity className="w-4 h-4 text-primary animate-pulse" />
                       Awaiting Data Stream Connectivity
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="flex items-center gap-3 h-16 px-10 rounded-[2rem] border-white/[0.08] bg-white/[0.02] text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04] transition-all"
                    >
                        <Download className="w-5 h-5 opacity-40" />
                        Export Data
                    </Button>
                    <Button
                        variant="primary"
                        className="flex items-center gap-3 h-16 px-10 rounded-[2rem] shadow-soft-glow"
                    >
                        <Calendar className="w-5 h-5" />
                        Time Range
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[
                    { label: 'Total Reach', value: '0.00', growth: '--%', isPositive: true, icon: Users, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'Growth Score', value: '--', growth: '--%', isPositive: true, icon: Zap, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
                    { label: 'Engagement Rate', value: '0.0%', growth: '--%', isPositive: true, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
                    { label: 'Content Value', value: '₹0.00', growth: '--%', isPositive: true, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                ].map((stat, i) => (
                    <Card key={i} className="p-8 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl group hover:scale-[1.02] transition-all duration-700 rounded-[2.5rem] shadow-glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 transition-colors duration-700" />
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 border shadow-glass", stat.bg, stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={cn("flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border opacity-50 shadow-glass", 
                                stat.isPositive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'
                            )}>
                                {stat.growth}
                            </div>
                        </div>
                        <p className="text-[10px] text-heaven-muted font-bold uppercase tracking-[0.2em] mb-2 opacity-40">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-heaven-text tracking-tight">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 p-16 h-[550px] border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] flex flex-col relative overflow-hidden group shadow-glass">
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <h3 className="text-2xl font-bold text-heaven-text tracking-tight uppercase">Strategic Trajectory</h3>
                        <div className="flex gap-2">
                            {['7D', '30D', '90D'].map((t) => (
                                <button 
                                    key={t} 
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all duration-500 uppercase tracking-widest ${t === '30D' ? 'bg-primary text-white shadow-soft-glow' : 'text-heaven-muted hover:text-heaven-text hover:bg-white/[0.04]'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-heaven-text relative z-10 space-y-8">
                        <div className="w-28 h-28 bg-white/[0.04] rounded-[3.5rem] border border-white/[0.08] flex items-center justify-center shadow-glass relative group">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BarChart3 className="w-12 h-12 text-heaven-text opacity-20" />
                        </div>
                        <div className="text-center space-y-4">
                            <p className="font-bold text-sm uppercase tracking-[0.5em] opacity-40">Null Signal Sequence</p>
                            <p className="text-[10px] font-medium text-heaven-muted opacity-30 italic max-w-xs mx-auto">Insights will populate as connections initialize across the network architecture.</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-16 border-white/[0.08] bg-[#050810]/90 backdrop-blur-3xl rounded-[4rem] shadow-glass relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <h3 className="text-2xl font-bold text-heaven-text mb-16 flex items-center gap-6 relative z-10 uppercase tracking-tight">
                        <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-soft-glow">
                            <Zap className="w-7 h-7" />
                        </div>
                        Top Assets
                    </h3>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
                         <div className="w-20 h-20 bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] flex items-center justify-center mx-auto opacity-30 shadow-glass">
                            <TrendingUp className="w-10 h-10 text-heaven-text" />
                         </div>
                         <p className="text-[11px] font-bold text-heaven-muted uppercase tracking-[0.4em] leading-loose max-w-xs opacity-60 italic">No high-performing content identified in the current cycle.</p>
                    </div>

                    <Button variant="secondary" className="w-full mt-16 h-18 text-[11px] font-bold uppercase tracking-[0.4em] rounded-[2.25rem] bg-white/[0.02] border-white/10 text-heaven-muted hover:text-heaven-text shadow-glass transition-all">
                        Asset Audit
                    </Button>
                </Card>
            </div>
        </div>
    );
}
