import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ArrowLeft, 
  Loader2, 
  Layout, 
  Search, 
  Zap, 
  Target as TargetIcon,
  AlertTriangle,
  Lightbulb,
  Send,
  MessageSquare,
  Sparkles,
  Globe,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export default function AuditPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [outreach, setOutreach] = useState('');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!leadId) return;
      try {
        const leadDoc = await getDoc(doc(db, 'leads', leadId));
        if (leadDoc.exists()) {
          const leadData = leadDoc.data();
          setLead({ id: leadDoc.id, ...leadData });
          
          if (leadData.auditId) {
            const auditDoc = await getDoc(doc(db, 'audits', leadData.auditId));
            if (auditDoc.exists()) {
              setAudit(auditDoc.data());
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId]);

  const runAudit = async () => {
    if (!lead?.website) {
      alert("No website provided for this lead.");
      return;
    }

    setAuditing(true);
    try {
      const response = await axios.post('/api/audit', { website: lead.website });
      const auditData = {
        ...response.data,
        leadId: lead.id,
        createdAt: new Date().toISOString()
      };

      // Save audit
      const auditRef = doc(collection(db, 'audits'));
      await setDoc(auditRef, auditData);

      // Update lead
      await updateDoc(doc(db, 'leads', lead.id), {
        auditId: auditRef.id,
        status: 'audited'
      });

      setAudit(auditData);
    } catch (err) {
      console.error(err);
      alert("Audit failed. The website might be blocking access.");
    } finally {
      setAuditing(false);
    }
  };

  const generateOutreach = async () => {
    setGeneratingOutreach(true);
    try {
      const response = await axios.post('/api/outreach', { lead, audit, tone: 'professional' });
      setOutreach(response.data.message);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingOutreach(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-brand-bg"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <button 
        onClick={() => navigate('/leads')}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Repository
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-brand-sidebar p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32" />
        <div className="space-y-4 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Gap Analysis Protocol</p>
          <h1 className="text-5xl font-serif italic text-white tracking-tight leading-tight">{lead?.name}</h1>
          <a 
            href={lead?.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : '#'} 
            target="_blank" 
            rel="noreferrer"
            className="text-slate-400 flex items-center gap-2 hover:text-white transition-colors text-sm font-medium italic"
          >
            <Globe size={16} className="text-slate-500" />
            {lead?.website || 'Digital Presence Missing'}
            <ExternalLink size={12} className="opacity-50" />
          </a>
        </div>
        
        <div className="relative z-10">
          {!audit ? (
            <button 
              onClick={runAudit}
              disabled={auditing || !lead?.website}
              className="flex items-center gap-3 bg-white text-black px-10 py-5 rounded-lg font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-50"
            >
              {auditing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {auditing ? 'Executing Analysis...' : 'Initiate Audit'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              <CheckCircle2 size={14} />
              Protocol Complete
            </div>
          )}
        </div>
      </div>

      {audit && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Audit Metrics */}
          <div className="lg:col-span-3 bg-brand-sidebar p-10 rounded-2xl border border-white/5 shadow-2xl space-y-10">
            <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
              <TargetIcon className="text-emerald-500" size={20} />
              Performance Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ScoreItem label="Interface UX" score={audit.scores.ui} color="text-amber-500" />
              <ScoreItem label="Search Visibility" score={audit.scores.seo} color="text-emerald-500" />
              <ScoreItem label="Runtime Speed" score={audit.scores.performance} color="text-blue-500" />
              <ScoreItem label="Conversion Logic" score={audit.scores.conversion} color="text-rose-500" />
            </div>
            
            <div className="pt-10 border-t border-white/5">
              <h4 className="font-bold flex items-center gap-2 text-amber-500 mb-6 text-xs uppercase tracking-[0.2em]">
                <AlertTriangle size={16} />
                Identified Vulnerabilities
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {audit.issues.map((issue: string, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-slate-400 leading-relaxed font-medium">
                    <span className="text-amber-500 font-bold shrink-0">0{idx + 1}</span>
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Insight */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-emerald-500/10 text-emerald-500 p-10 rounded-2xl border border-emerald-500/20 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-2 opacity-80">
                  <Lightbulb size={14} />
                  AI Engagement Strategy
                </h3>
                <p className="text-emerald-100 font-serif italic text-xl leading-relaxed">"{audit.pitch}"</p>
              </div>
              
              <button 
                onClick={generateOutreach}
                disabled={generatingOutreach}
                className="mt-10 flex items-center justify-center gap-3 bg-emerald-500 text-black px-8 py-4 rounded font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
              >
                {generatingOutreach ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                Generate Outreach Script
              </button>
            </div>

            <AnimatePresence>
              {outreach && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-sidebar border border-white/10 p-1 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <Send size={14} className="text-emerald-500" />
                        Engagement Draft
                      </h3>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(outreach);
                          alert('Copied to clipboard');
                        }}
                        className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white border border-white/10 px-3 py-1 rounded transition-colors"
                      >
                        Copy Script
                      </button>
                    </div>
                    <div className="bg-white/5 p-6 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium h-[300px] overflow-y-auto custom-scrollbar">
                      {outreach}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ScoreItem({ label, score, color }: { label: string, score: number, color: string }) {
  const percentage = score * 10;
  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`font-serif italic text-xl ${color}`}>{score}/10</span>
      </div>
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
