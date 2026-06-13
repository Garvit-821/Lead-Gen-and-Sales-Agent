/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Search, FileText, Send, Settings, LogIn, LogOut, Loader2, Target } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import LeadSearch from './pages/LeadSearch';
import LeadDatabase from './pages/LeadDatabase';
import AuditPage from './pages/AuditPage';
import Campaigns from './pages/Campaigns';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-bg">
        <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-brand-bg px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8 relative z-10"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-serif italic text-white tracking-tight">LeadAgent.ai</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Intelligence & Validation</p>
          </div>
          <p className="text-slate-400 text-lg font-light leading-relaxed">
            Discover elite business leads, analyze digital gaps, and automate high-conversion outreach with AI.
          </p>
          <button
            onClick={login}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-8 py-4 text-sm font-bold text-black uppercase tracking-widest transition-all hover:bg-slate-100 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <LogIn size={20} />
            Authorize with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-brand-bg text-slate-200 overflow-hidden font-sans">
        {/* Navigation Sidebar */}
        <aside className="w-64 h-full border-r border-white/10 bg-brand-sidebar flex flex-col">
          <div className="p-8">
            <h1 className="text-2xl font-serif italic text-white tracking-tight">LeadAgent.ai</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1">Intelligence & Validation</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavItem to="/search" icon={<Search size={18} />} label="Discovery Engine" />
            <NavItem to="/leads" icon={<FileText size={18} />} label="Lead Database" />
            <NavItem to="/campaigns" icon={<Send size={18} />} label="Outreach Hub" />
          </nav>

          <div className="p-6 border-t border-white/10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30">
                <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Agent Active</p>
                <p className="text-[10px] text-slate-500 italic">Connected to Gemini 1.5</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-slate-500 rounded-lg hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Terminate Session
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<LeadSearch />} />
              <Route path="/leads" element={<LeadDatabase />} />
              <Route path="/audit/:leadId" element={<AuditPage />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-white/5 hover:text-white transition-all group border border-transparent hover:border-white/10"
    >
      <span className="text-slate-500 group-hover:text-emerald-500 transition-colors">{icon}</span>
      {label}
    </Link>
  );
}
