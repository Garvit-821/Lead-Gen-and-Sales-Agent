import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, FileSearch, Send, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    auditedLeads: 0,
    outreachSent: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        const leads = snapshot.docs.map(d => d.data());
        
        setStats({
          totalLeads: leads.length,
          auditedLeads: leads.filter(l => l.status === 'audited').length,
          outreachSent: leads.filter(l => l.status === 'contacted').length,
          conversionRate: 15 // Mocked for now
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [user]);

  const chartData = [
    { name: 'Mon', leads: 4 },
    { name: 'Tue', leads: 7 },
    { name: 'Wed', leads: 12 },
    { name: 'Thu', leads: 8 },
    { name: 'Fri', leads: 15 },
    { name: 'Sat', leads: 5 },
    { name: 'Sun', leads: 3 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-12"
    >
      <header>
        <h1 className="text-4xl font-serif italic text-white tracking-tight">Agency Overview</h1>
        <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest">Intelligence & Performance Metrics</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/5">
        <StatCard title="Leads Discovered" value={stats.totalLeads} trend="+12% weekly" />
        <StatCard title="Website Gaps" value={stats.auditedLeads} trend="41 new detections" color="text-amber-500" />
        <StatCard title="Email Confidence" value={`${stats.outreachSent > 0 ? 94.2 : 0}%`} trend="Verified" color="text-emerald-500" />
        <StatCard title="Priority Score" value={stats.conversionRate} trend="AI Qualified" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-brand-sidebar p-8 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif italic text-xl text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Acquisition Velocity
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, letterSpacing: '0.1em' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F0F11', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="leads" fill="#10b981" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Feed */}
        <div className="bg-brand-sidebar p-8 rounded-2xl border border-white/5 shadow-2xl">
          <h3 className="font-serif italic text-xl text-white mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" />
            AI Intelligence Feed
          </h3>
          <div className="space-y-4">
            <AlertItem 
              title="Identity: Strategic Opportunity" 
              desc="Health clinic 'Aura Care' in Delhi found with no online presence. Redesign urgency: High." 
              type="success"
            />
            <AlertItem 
              title="Integrity Error: Broken SSL" 
              desc="'Global Solutions' website is inaccessible due to certificate expiry. High churn risk detected." 
              type="warning"
            />
            <AlertItem 
              title="Validation: Bounce Detected" 
              desc="Contact 'admin@apex.in' invalidated. Suggested manual discovery via LinkedIn." 
              type="error"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, trend, color = 'text-white' }: { title: string, value: string | number, trend: string, color?: string }) {
  return (
    <div className="bg-brand-header p-8 transition-colors hover:bg-white/[0.02]">
      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</p>
      <h4 className={`text-4xl font-serif mt-1 ${color}`}>{value}</h4>
      <p className="text-[10px] text-slate-400 font-medium mt-3 italic">{trend}</p>
    </div>
  );
}

function AlertItem({ title, desc, type }: { title: string, desc: string, type: 'success' | 'warning' | 'error' }) {
  const styles = {
    success: 'border-emerald-500/20 bg-emerald-500/5 text-slate-300 dot-emerald-500',
    warning: 'border-amber-500/20 bg-amber-500/5 text-slate-300 dot-amber-500',
    error: 'border-rose-500/20 bg-rose-500/5 text-slate-300 dot-rose-500'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500'
  };

  return (
    <div className={`p-4 rounded-lg border flex gap-4 ${styles[type]}`}>
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColors[type]}`} />
      <div>
        <h5 className="font-semibold text-xs text-white uppercase tracking-wider">{title}</h5>
        <p className="text-[11px] mt-1 leading-relaxed opacity-80">{desc}</p>
      </div>
    </div>
  );
}
