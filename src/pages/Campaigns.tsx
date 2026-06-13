import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Send, 
  Target, 
  Users, 
  BarChart2, 
  Mail, 
  MessageSquare,
  MoreVertical,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'campaigns'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user]);

  const createCampaign = async () => {
    if (!user || !newCampaignName) return;
    try {
      await addDoc(collection(db, 'campaigns'), {
        name: newCampaignName,
        status: 'draft',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        leadsCount: 0,
        replies: 0
      });
      setNewCampaignName('');
      setShowNewModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-12">
      <header className="flex justify-between items-center border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-serif italic text-white tracking-tight">Campaign Lab</h1>
          <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest italic">Precision Outreach & Engagement Engine</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] active:scale-95"
        >
          <Plus size={18} />
          Create Objective
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((c, idx) => (
          <motion.div 
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-brand-sidebar p-8 rounded-2xl border border-white/5 shadow-2xl hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16" />
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
                <Layers size={20} />
              </div>
              <button className="text-slate-600 hover:text-white transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className="text-2xl font-serif italic text-white mb-2 relative z-10 leading-tight">{c.name}</h3>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 text-slate-500 relative z-10">
              <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`} />
              {c.status} Protocol
            </p>

            <div className="mt-10 grid grid-cols-2 gap-8 pb-8 border-b border-white/5 relative z-10">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Targets</p>
                <div className="flex items-center gap-2 font-serif italic text-xl text-white">
                  {c.leadsCount || 0}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Responses</p>
                <div className="flex items-center gap-2 font-serif italic text-xl text-emerald-500">
                  {c.replies || 0}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-white font-bold text-[10px] uppercase tracking-[0.2em] relative z-10">
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">Interaction Analytics</span>
              <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform text-emerald-500" />
            </div>
          </motion.div>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full py-32 text-center bg-brand-sidebar border border-white/5 border-dashed rounded-3xl">
            <div className="text-slate-800 mb-6 flex justify-center">
              <Plus size={64} />
            </div>
            <p className="text-slate-500 font-serif italic text-xl">Operational silence. Initialize mission profile...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-sidebar rounded-2xl p-10 max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <h3 className="text-3xl font-serif italic text-white mb-8">Define Mission Objective</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-3">Objective Designation</label>
                  <input 
                    type="text" 
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="e.g. Strategic Real Estate Acquisition"
                    className="w-full bg-white/5 px-5 py-4 rounded border border-white/10 text-white placeholder:text-slate-700 outline-none focus:border-white transition-all text-sm font-medium"
                  />
                </div>
                <div className="pt-6 flex gap-4">
                  <button 
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 px-8 py-4 rounded text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={createCampaign}
                    className="flex-1 px-8 py-4 rounded bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                  >
                    Initialize
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
