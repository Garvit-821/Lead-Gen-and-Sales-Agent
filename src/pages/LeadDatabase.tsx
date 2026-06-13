import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Trash2, 
  FileSearch, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Filter,
  ExternalLink,
  Star,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function LeadDatabase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredLeads.map(lead => ({
      'Business Name': lead.name,
      'Category': lead.category,
      'Status': lead.status,
      'Rating': lead.rating,
      'ReviewsCount': lead.reviewCount,
      'Website': lead.website,
      'Phone': lead.phone,
      'Address': lead.address,
      'Date Added': lead.createdAt ? format(lead.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `leads_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const filteredLeads = leads.filter(l => filter === 'all' || l.status === filter);

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-serif italic text-white tracking-tight">Lead Repository</h1>
          <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest">Active Intelligence Database</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Entities" />
            <FilterButton active={filter === 'new'} onClick={() => setFilter('new')} label="Discovery" />
            <FilterButton active={filter === 'audited'} onClick={() => setFilter('audited')} label="Audited" />
            <FilterButton active={filter === 'contacted'} onClick={() => setFilter('contacted')} label="Engaged" />
          </div>

          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-500 text-black px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            <Download size={14} />
            Export XLSX
          </button>
        </div>
      </header>

      <div className="bg-brand-sidebar rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-header border-b border-white/10">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Business Identity</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Current State</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Progression History</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Value Score</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Communication</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Archived</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredLeads.map((lead) => (
                <motion.tr 
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-serif italic text-lg text-white">{lead.name}</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{lead.category}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-8 py-6">
                    <StatusTimeline 
                      status={lead.status} 
                      onSelectStatus={(newStatus) => updateStatus(lead.id, newStatus)} 
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                      <Star size={12} fill="currentColor" />
                      {lead.rating}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col text-xs space-y-1">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                          Digital Hub <ExternalLink size={10} />
                        </a>
                      ) : <span className="text-amber-500/80 italic font-medium">Gap Detected</span>}
                      <span className="text-slate-500">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-500 font-medium italic">
                    {lead.createdAt ? format(lead.createdAt.toDate(), 'MMM dd, yyyy') : 'Staged'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <button 
                        onClick={() => navigate(`/audit/${lead.id}`)}
                        className="p-2.5 text-emerald-500 hover:bg-emerald-500/10 rounded border border-emerald-500/20 transition-all"
                        title="Analyze Gaps"
                      >
                        <FileSearch size={14} />
                      </button>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/20 transition-all"
                        title="Purge Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-20 bg-brand-sidebar">
            <p className="text-slate-500 font-serif italic text-lg">No intelligence matches your current parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2 text-[10px] font-bold rounded uppercase tracking-widest transition-all ${
        active 
        ? 'bg-white text-black shadow-lg shadow-white/10' 
        : 'text-slate-500 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    new: { label: 'Discovered', color: 'text-blue-400 border-blue-400/20 bg-blue-400/5', dot: 'bg-blue-400' },
    audited: { label: 'Validated', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5', dot: 'bg-emerald-400' },
    contacted: { label: 'Engaged', color: 'text-amber-400 border-amber-400/20 bg-amber-400/5', dot: 'bg-amber-400' },
    rejected: { label: 'Exited', color: 'text-slate-500 border-slate-500/20 bg-slate-500/5', dot: 'bg-slate-500' }
  };

  const config = configs[status] || configs.new;

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-widest ${config.color}`}>
      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function StatusTimeline({ status, onSelectStatus }: { status: string; onSelectStatus: (newStatus: string) => void }) {
  const stages = [
    { key: 'new', label: 'Discovery', icon: Clock },
    { key: 'audited', label: 'Audit', icon: FileSearch },
    { key: 'contacted', label: 'Engagement', icon: CheckCircle2 }
  ];

  let currentStageIndex = 0;
  if (status === 'audited') currentStageIndex = 1;
  else if (status === 'contacted') currentStageIndex = 2;
  else if (status === 'rejected') currentStageIndex = -1;

  return (
    <div className="flex items-center gap-1.5 py-1">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isCompleted = currentStageIndex >= index && currentStageIndex !== -1;
        const isCurrent = currentStageIndex === index;
        const isRejected = status === 'rejected';

        let tintClass = 'text-slate-600 bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10';
        let isPast = isCompleted && !isCurrent;

        if (isRejected) {
          tintClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        } else if (isCurrent) {
          tintClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30 ring-1 ring-blue-400/25';
        } else if (isPast) {
          tintClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
        }

        const isLast = index === stages.length - 1;

        return (
          <React.Fragment key={stage.key}>
            <button
              onClick={() => onSelectStatus(stage.key)}
              className={`p-1.5 rounded-lg border flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer group/node relative`}
              title={`Promote lead to: ${stage.label}`}
            >
              <Icon size={12} className="transition-transform duration-200 group-hover/node:scale-110" />
              
              {/* Floating Tooltip */}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[9px] font-bold text-white rounded opacity-0 group-hover/node:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                {stage.label} ({isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Set Active'})
              </span>
            </button>
            
            {!isLast && (
              <div className="w-5 h-[2px] relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                  isRejected 
                    ? 'bg-rose-500/20' 
                    : currentStageIndex > index 
                      ? 'bg-emerald-400/60' 
                      : 'bg-white/5'
                }`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
