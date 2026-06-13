import React, { useState } from 'react';
import { Search, MapPin, Loader2, Save, Globe, Phone, Star, Plus, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

interface Business {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
}

export default function LeadSearch() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [auditingIds, setAuditingIds] = useState<string[]>([]);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !location) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/search', { category, location, noWebsiteOnly });
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveLead = async (biz: Business) => {
    if (!user) return;

    try {
      // Check if already exists for this user
      const q = query(
        collection(db, 'leads'), 
        where('ownerId', '==', user.uid),
        where('name', '==', biz.name)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        alert('Lead already saved!');
        return;
      }

      const leadDoc = await addDoc(collection(db, 'leads'), {
        ...biz,
        ownerId: user.uid,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      
      setSavedIds(prev => [...prev, biz.name]);

      // Automatic Audit Trigger
      if (biz.website) {
        setAuditingIds(prev => [...prev, biz.name]);
        
        // Run audit in background
        (async () => {
          try {
            const auditResponse = await axios.post('/api/audit', { website: biz.website });
            const auditData = auditResponse.data;

            const auditRef = await addDoc(collection(db, 'audits'), {
              leadId: leadDoc.id,
              ownerId: user.uid,
              ...auditData,
              createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'leads', leadDoc.id), {
              status: 'audited',
              auditId: auditRef.id
            });
          } catch (err) {
            console.error('Auto-audit failed:', err);
          } finally {
            setAuditingIds(prev => prev.filter(id => id !== biz.name));
          }
        })();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="text-center space-y-6 mb-12">
        <h1 className="text-5xl font-serif italic text-white tracking-tight">Discovery Engine</h1>
        <p className="text-slate-500 text-lg font-light tracking-wide max-w-2xl mx-auto">
          Scale your pipeline with AI-driven business intelligence. Identify digital gaps and high-value opportunities.
        </p>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-0 max-w-4xl mx-auto mt-12 bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex-1 flex items-center gap-3 px-6 border-r border-white/5 py-4">
            <Search className="text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Business Category" 
              className="bg-transparent w-full outline-none text-white font-medium placeholder:text-slate-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="flex-1 flex items-center gap-3 px-6 py-4">
            <MapPin className="text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Territory Selection" 
              className="bg-transparent w-full outline-none text-white font-medium placeholder:text-slate-600"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            className="bg-white text-black px-10 py-4 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {loading ? 'Analyzing...' : 'Execute Search'}
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${noWebsiteOnly ? 'bg-emerald-500' : 'bg-white/10 border border-white/10'}`}
              onClick={() => setNoWebsiteOnly(!noWebsiteOnly)}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${noWebsiteOnly ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 group-hover:text-white transition-colors">
              Filter: Missing Digital Presence Only
            </span>
          </label>
        </div>
      </header>

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((biz, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-brand-sidebar p-8 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif italic text-2xl text-white leading-tight">{biz.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">{biz.category}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 text-amber-500 px-2 py-1 rounded text-[10px] font-bold border border-white/5">
                    <Star size={10} fill="currentColor" />
                    {biz.rating}
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                  <MapPin size={12} className="text-slate-500" />
                  {biz.address}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {biz.website ? (
                    <span className="px-2 py-1 bg-white/5 text-slate-300 text-[10px] rounded border border-white/5 uppercase tracking-wider">
                      Website Detected
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] rounded border border-amber-500/20 uppercase tracking-widest font-bold">
                      Critical: No Website
                    </span>
                  )}
                  {biz.phone && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] rounded border border-emerald-500/20 uppercase tracking-wider font-medium">
                      Phone Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">{biz.reviewCount} Valid Reviews</span>
                <button 
                  onClick={() => saveLead(biz)}
                  disabled={savedIds.includes(biz.name)}
                  className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded transition-all uppercase tracking-widest ${
                    savedIds.includes(biz.name) 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-white text-black border border-white hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  {savedIds.includes(biz.name) ? (
                    auditingIds.includes(biz.name) ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={12} />
                        Protocol: Auditing
                      </span>
                    ) : 'Lead Saved'
                  ) : 'Archive Lead'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
      
      {!loading && results.length === 0 && (
        <div className="text-center py-32 bg-brand-sidebar border border-white/5 rounded-3xl border-dashed">
          <div className="text-slate-800 mb-6 flex justify-center">
            <Search size={64} />
          </div>
          <p className="text-slate-500 font-serif italic text-xl">Operational readiness. Awaiting search parameters...</p>
        </div>
      )}
    </div>
  );
}
