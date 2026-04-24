import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Brain, 
  Users, 
  LayoutDashboard, 
  ShieldAlert, 
  MessageSquare,
  History,
  TrendingUp,
  Award,
  AlertCircle,
  Plus,
  ChevronRight,
  Play,
  Settings,
  Flame,
  ArrowRight,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, saveProspect, getProspects, saveSession } from './db';

// Original Framework Data
const GATE_DATA = {
  g1: {
    name: "Gate 1: NEED", short: "NEED", color: "#C0392B",
    purpose: "Understand EXACTLY what the prospect needs, how they want it delivered, and what outcome they expect.",
    checkpoints: ["Specific Need", "Implementation", "Expected Outcome"],
    keyQuestions: ["How can I help?", "What success looks like?", "Numbers/Metrics?"],
  },
  g2: {
    name: "Gate 2: TIMELINE", short: "TIMELINE", color: "#D4820A",
    purpose: "Understand WHEN they want to move forward, WHO makes the decision, and WHAT the process looks like.",
    checkpoints: ["Implementation Date", "Decision Makers", "Approval Process"],
    keyQuestions: ["When to start?", "Who else is involved?", "Decision criteria?"],
  },
  g3: {
    name: "Gate 3: BUDGET", short: "BUDGET", color: "#6B3FA0",
    purpose: "Understand if they CAN pay and if they're WILLING to allocate.",
    checkpoints: ["Investment Capacity", "Allocation Willingness", "Value Gap"],
    keyQuestions: ["Budget in mind?", "Allocation vs Capacity?", "Cost of inaction?"],
  }
};

const FLOW = [
  { key: "rapport", label: "Rapport", color: "#1A8A7D" },
  { key: "segue", label: "Segue", color: "#2E6DB4" },
  { key: "g1", label: "Gate 1: Need", color: "#C0392B" },
  { key: "g2", label: "Gate 2: Timeline", color: "#D4820A" },
  { key: "g3", label: "Gate 3: Budget", color: "#6B3FA0" },
  { key: "pain", label: "Pain Discovery", color: "#B83280" },
  { key: "pitch", label: "Pitch & Close", color: "#2D8B46" },
];

import { useRecorder, useAIEngine, useTranscription, useAudioVisualizer, useAnalytics, useSound, Embers, useDeepAnalysis } from './hooks';

import { supabase } from './supabase';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prospects, setProspects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [activeGate, setActiveGate] = useState('rapport');
  const [aiPersonality, setAiPersonality] = useState('Strategist');
  const { isRecording, startRecording, stopRecording, audioUrl } = useRecorder();
  const { insights, generateInsight } = useAIEngine(aiPersonality);
  const { transcript, startListening, stopListening, clearTranscript } = useTranscription();
  const { heatmap } = useAnalytics(sessions);
  const { playSound } = useSound();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    playSound('click');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    // If Supabase is configured, fetch from cloud, otherwise fallback to Dexie
    if (import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co') {
      const { data: p } = await supabase.from('prospects').select('*').order('createdAt', { ascending: false });
      const { data: s } = await supabase.from('sessions').select('*');
      if (p) setProspects(p);
      if (s) setSessions(s);
    } else {
      const [p, s] = await Promise.all([
        getProspects(),
        db.sessions.toArray()
      ]);
      setProspects(p);
      setSessions(s);
    }
  };

  if (!session) return <Auth />;

  const startNewCall = async (prospectId) => {
    let sessionId;
    if (import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co') {
      const { data, error } = await supabase.from('sessions').insert([{ 
        prospect_id: prospectId, 
        user_id: session.user.id,
        status: 'ongoing' 
      }]).select();
      if (data) sessionId = data[0].id;
    } else {
      sessionId = await saveSession(prospectId);
    }
    
    setCurrentSession(sessionId);
    startRecording();
    startListening();
    setActiveTab('live-call');
    setActiveGate('rapport');
    clearTranscript();
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        generateInsight(activeGate, transcript);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isRecording, activeGate, transcript]);

  const handleStopCall = () => {
    stopRecording();
    stopListening();
    setActiveTab('analysis');
  };

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden font-['Inter']">
      <Embers />
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 border-r border-white/5 flex flex-col items-center lg:items-start p-6 glass relative z-10">
        <div className="flex items-center justify-between w-full mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF3B30] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,59,48,0.3)]">
              <Flame size={24} fill="white" />
            </div>
            <span className="text-xl font-bold font-['Outfit'] hidden lg:block tracking-tight">GATES OF HELL</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[#A1A1AA] hover:text-white"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex-1 w-full space-y-2">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); playSound('click'); }} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarLink active={activeTab === 'prospects'} onClick={() => { setActiveTab('prospects'); playSound('click'); }} icon={<Users size={20} />} label="Prospect DB" />
          <SidebarLink active={activeTab === 'training'} onClick={() => { setActiveTab('training'); playSound('click'); }} icon={<Award size={20} />} label="Battle Mode" />
          <SidebarLink active={activeTab === 'leaderboard'} onClick={() => { setActiveTab('leaderboard'); playSound('click'); }} icon={<TrendingUp size={20} />} label="Leaderboard" />
          <SidebarLink active={activeTab === 'live-call'} onClick={() => setActiveTab('live-call')} icon={<Mic size={20} />} label="Live Call" disabled={!isRecording} />
        </div>

        <div className="w-full pt-6 border-t border-white/5 space-y-4">
          <div className="px-4">
            <label className="text-[9px] font-bold text-[#52525B] uppercase tracking-widest mb-2 block">AI Personality</label>
            <select 
              value={aiPersonality} 
              onChange={(e) => setAiPersonality(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-[#FF3B30] transition-all"
            >
              <option value="Strategist">Strategist</option>
              <option value="Drill Sergeant">Drill Sergeant</option>
              <option value="The Closer">The Closer</option>
            </select>
          </div>
          <div className="px-4 py-2">
            <div className="text-[10px] font-bold text-[#62626C] uppercase tracking-widest mb-1">Signed in as</div>
            <div className="text-xs text-white truncate font-medium">{session.user.email}</div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard key="dash" onNewCall={startNewCall} prospects={prospects} loadData={loadData} heatmap={heatmap} />}
          {activeTab === 'prospects' && <ProspectDatabase key="prospects" prospects={prospects} onNewCall={startNewCall} />}
          {activeTab === 'training' && <ObjectionTraining key="training" />}
          {activeTab === 'leaderboard' && <Leaderboard key="leaderboard" />}
          {activeTab === 'live-call' && <LiveCallInterface key="live" isRecording={isRecording} stopCall={handleStopCall} aiSuggestions={insights} activeGate={activeGate} setActiveGate={setActiveGate} transcript={transcript} />}
          {activeTab === 'analysis' && <PostCallAnalysis key="analysis" audioUrl={audioUrl} transcript={transcript} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, disabled }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white/10 text-white shadow-sm' 
          : 'text-[#94949E] hover:bg-white/5 hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon}
      <span className="font-medium hidden lg:block text-sm">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C0392B] shadow-[0_0_10px_rgba(192,57,43,1)]" />}
    </button>
  );
}

function Dashboard({ onNewCall, prospects, loadData, heatmap }) {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!name) return;
    
    if (import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co') {
      const { error } = await supabase.from('prospects').insert([{ 
        name, 
        user_id: (await supabase.auth.getUser()).data.user.id 
      }]);
      if (error) console.error(error);
    } else {
      await saveProspect(name);
    }
    
    setName('');
    setIsAdding(false);
    loadData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold font-['Outfit'] mb-2 premium-gradient-text">Welcome Back, Closer</h1>
          <p className="text-[#94949E]">The gates are waiting. {prospects.length} targets in the pipeline.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 transition-all"
        >
          <Plus size={20} />
          New Prospect
        </button>
      </header>

      {/* Heatmap & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<TrendingUp className="text-green-400" />} label="Win Rate" value="68%" sub="Last 30 days" />
          <StatCard icon={<Brain className="text-purple-400" />} label="AI Accuracy" value="92%" sub="Framework adherence" />
          <StatCard icon={<Award className="text-yellow-400" />} label="Avg. Deal" value="$4.2k" sub="Per gate closure" />
        </div>
        <div className="p-6 rounded-2xl border border-white/5 glass flex flex-col">
          <span className="text-[10px] font-bold text-[#62626C] uppercase tracking-widest mb-4">Gate Failures (Heatmap)</span>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {['g1', 'g2', 'g3'].map(g => (
              <div key={g} className="flex items-center gap-3">
                <span className="text-[10px] font-bold w-4">{g.toUpperCase()}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(heatmap[g] / (Math.max(...Object.values(heatmap)) || 1)) * 100}%` }}
                    className="h-full bg-[#C0392B]" 
                  />
                </div>
                <span className="text-[10px] font-bold text-[#94949E]">{heatmap[g]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold font-['Outfit'] mb-6 flex items-center gap-2">
        <Users size={20} className="text-[#C0392B]" />
        Active Pipelines
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prospects.map(p => (
          <div key={p.id} className="p-6 rounded-2xl border border-white/5 glass hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold">
                {p.name[0]}
              </div>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                {p.status}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">{p.name}</h3>
            <p className="text-xs text-[#62626C] mb-6">Added {new Date(p.createdAt).toLocaleDateString()}</p>
            
            <div className="flex gap-2 mb-8">
              {['G1', 'G2', 'G3'].map(g => (
                <div key={g} className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="w-0 h-full bg-[#C0392B]" />
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNewCall(p.id)}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 hover:bg-[#C0392B] hover:border-[#C0392B] transition-all group-hover:scale-[1.02]"
            >
              <Play size={16} fill="currentColor" />
              <span className="text-sm font-bold">Start Session</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-[#121214] shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 font-['Outfit']">New Prospect</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="Full Name / Company Name" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:border-[#C0392B] transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-[#94949E] font-bold">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-4 bg-[#C0392B] rounded-xl font-bold shadow-[0_0_20px_rgba(192,57,43,0.3)]">Add Prospect</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 glass flex flex-col gap-1">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-[#94949E] font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold font-['Outfit']">{value}</div>
      <div className="text-[10px] text-[#62626C] uppercase font-bold tracking-widest">{sub}</div>
    </div>
  );
}

function LiveCallInterface({ isRecording, stopCall, aiSuggestions, activeGate, setActiveGate, transcript }) {
  const [timer, setTimer] = useState(0);
  const scrollRef = useRef(null);
  const visualizerData = useAudioVisualizer(isRecording);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="p-6 border-b border-white/5 glass flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <div className="recording-indicator" />
            <span className="text-xs font-bold text-red-400 tracking-wider">LIVE RECORDING</span>
          </div>
          
          {/* Waveform */}
          <div className="flex items-end gap-[2px] h-6 w-32">
            {Array.from(visualizerData).slice(0, 32).map((v, i) => (
              <motion.div 
                key={i} 
                animate={{ height: `${Math.max(4, (v / 255) * 100)}%` }}
                className="w-1 bg-[#C0392B] rounded-full opacity-40" 
              />
            ))}
          </div>

          <span className="text-2xl font-mono font-bold">{formatTime(timer)}</span>
        </div>

        <div className="flex gap-2">
          {FLOW.map(s => (
            <button 
              key={s.key} 
              onClick={() => setActiveGate(s.key)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeGate === s.key ? 'bg-white text-black' : 'bg-white/5 text-[#62626C] hover:text-white hover:bg-white/10'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button 
          onClick={stopCall}
          className="bg-white/5 border border-white/10 hover:bg-red-500 hover:border-red-500 px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 group"
        >
          <Square size={16} className="group-hover:fill-white" />
          <span className="text-sm font-bold">End Session</span>
        </button>
      </div>

      {/* Main Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Transcript & AI Feed */}
        <div ref={scrollRef} className="flex-1 flex flex-col p-8 overflow-y-auto space-y-8 scroll-smooth">
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                <Mic size={48} className="mb-4" />
                <p className="text-xl font-bold">Listening for your voice...</p>
                <p className="text-sm">Speak to begin the live transcription</p>
              </div>
            ) : (
              transcript.map((t, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${t.role === 'prospect' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${t.role === 'prospect' ? 'bg-white/5 border border-white/5' : 'bg-[#C0392B]/10 border border-[#C0392B]/20'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{t.role}</div>
                    <div className="text-sm leading-relaxed">{t.text}</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: AI Analysis Panel */}
        <div className="w-96 border-l border-white/5 glass p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <Brain className="text-[#C0392B]" size={20} />
            <h3 className="text-lg font-bold font-['Outfit']">AI Live Insights</h3>
          </div>

          <div className="space-y-4 mb-8">
            {aiSuggestions.map(s => (
              <motion.div 
                key={s.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Coach Recommendation</span>
                </div>
                <p className="text-sm text-blue-100/80 leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#62626C] uppercase tracking-wider">Current Objective</span>
              <span className="text-[10px] bg-[#C0392B] px-2 py-0.5 rounded text-white font-bold">NEED</span>
            </div>
            
            <div>
              <h4 className="text-sm font-bold mb-3">Gate 1 Checkpoints</h4>
              <div className="space-y-2">
                {GATE_DATA.g1.checkpoints.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/10 flex items-center justify-center">
                      {i === 0 && <div className="w-2 h-2 bg-[#C0392B] rounded-sm" />}
                    </div>
                    <span className="text-xs text-[#94949E]">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-sm font-bold mb-3">Suggested Questions</h4>
              <div className="space-y-2">
                {GATE_DATA.g1.keyQuestions.map((q, i) => (
                  <div key={i} className="p-2 rounded bg-white/5 text-[11px] text-[#94949E] hover:text-white cursor-pointer transition-colors">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 border-t border-white/5 glass bg-black/40 flex justify-center items-center gap-8">
        <button className="text-[#94949E] hover:text-white transition-all flex flex-col items-center gap-1">
          <MessageSquare size={20} />
          <span className="text-[9px] font-bold uppercase">Notes</span>
        </button>
        <div className="h-8 w-px bg-white/5" />
        <button className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all text-[#C0392B]">
          <Mic size={24} />
        </button>
        <div className="h-8 w-px bg-white/5" />
        <button className="text-[#94949E] hover:text-white transition-all flex flex-col items-center gap-1">
          <ShieldAlert size={20} />
          <span className="text-[9px] font-bold uppercase">Objections</span>
        </button>
      </div>
    </div>
  );
}

function PostCallAnalysis({ audioUrl, transcript }) {
  const { analyzeConversation, analyzing, solution } = useDeepAnalysis();
  const { playSound } = useSound();

  const exportCRM = () => {
    playSound('click');
    const content = `
# Gates of Hell: Strategic Solution Report
Prospect: John Doe
Strategy: ${solution?.solutionArchitecture || 'Standard Close'}

## Strategic Analysis
${solution?.strategicHook || 'N/A'}

## Transcript Analysis
${transcript.map(t => `[${t.role.toUpperCase()}] ${t.text}`).join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategic-solution-${Date.now()}.md`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 max-w-5xl mx-auto w-full relative z-10">
      <header className="mb-12 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold tracking-widest uppercase">Analysis Mode</div>
            <span className="text-[#52525B] text-xs font-bold">SESSION ID: #GH-${Math.floor(Math.random()*10000)}</span>
          </div>
          <h1 className="text-5xl font-bold font-['Outfit'] premium-gradient-text">Personalized Close Plan</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { analyzeConversation(transcript, "John Doe"); playSound('gate'); }}
            disabled={analyzing}
            className="px-6 py-3 rounded-xl bg-[#FF3B30] text-white font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,59,48,0.4)] transition-all disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
            {analyzing ? 'Architecting...' : 'Generate Solution'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Solution Map */}
        <div className="lg:col-span-2 p-8 rounded-3xl border border-white/5 glass relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-[#FF3B30]" size={24} />
              Strategic Alignment Map
            </h3>
            <span className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Pain vs. Solution</span>
          </div>

          <div className="space-y-8 relative">
            <div className="absolute left-[39px] top-4 bottom-4 w-px bg-white/5" />
            
            <AlignmentPoint 
              label="The Pain" 
              icon={<ShieldAlert size={16} />} 
              color="#FF3B30"
              content={solution?.painPoints[0] || "Awaiting Analysis..."} 
            />
            <AlignmentPoint 
              label="The Solution" 
              icon={<Brain size={16} />} 
              color="#BF5AF2"
              content={solution?.solutionArchitecture || "Awaiting Analysis..."} 
            />
            <AlignmentPoint 
              label="The Value" 
              icon={<Award size={16} />} 
              color="#FF9F0A"
              content={solution?.personalizedValue || "Awaiting Analysis..."} 
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 glass">
            <h4 className="text-xs font-bold text-[#52525B] uppercase tracking-widest mb-4">Conversation Pacing</h4>
            <div className="flex items-end gap-2 h-20 mb-4">
              {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-white/5 rounded-t-sm relative group">
                  <div style={{ height: `${h}%` }} className="absolute bottom-0 inset-x-0 bg-[#FF3B30] opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-[#52525B]">
              <span>RAPPORT</span>
              <span>CLOSE</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-[#FF3B30]/20 bg-[#FF3B30]/5">
            <h4 className="text-xs font-bold text-[#FF3B30] uppercase tracking-widest mb-2">The Strategic Hook</h4>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              {solution?.strategicHook || "Generate a solution to find the psychological leverage point for this deal."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl border border-white/5 glass bg-gradient-to-br from-[#0D0D0F] to-transparent">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-['Outfit']">Next Strategic Steps</h3>
          <button onClick={exportCRM} className="text-xs text-[#FF3B30] font-bold hover:underline">Export Full Strategy</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button className="p-6 rounded-2xl bg-white text-black font-bold flex items-center justify-between group hover:bg-white/90 transition-all">
            <span>Schedule Follow-up Call</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="p-6 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all">
            Send Personalized Proposal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AlignmentPoint({ label, icon, color, content }) {
  return (
    <div className="flex gap-6 relative group">
      <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 shadow-xl" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="flex-1 pt-1">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-40" style={{ color: color }}>{label}</div>
        <div className="text-lg font-medium group-hover:text-white transition-colors">{content}</div>
      </div>
    </div>
  );
}

function AnalysisItem({ text }) {
  return (
    <li className="flex items-start gap-3">
      <ChevronRight size={18} className="mt-1 text-[#C0392B]" />
      <span className="text-[#94949E] text-sm leading-relaxed">{text}</span>
    </li>
  )
}

function ProspectDatabase({ prospects, onNewCall }) {
  return (
    <div className="p-12">
      <h1 className="text-3xl font-bold mb-8 font-['Outfit']">Prospect Database</h1>
      <div className="rounded-2xl border border-white/5 glass overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#62626C]">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#62626C]">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#62626C]">Last Action</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#62626C]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map(p => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-6 font-bold">{p.name}</td>
                <td className="px-6 py-6">
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider">{p.status}</span>
                </td>
                <td className="px-6 py-6 text-sm text-[#94949E]">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-6">
                  <button onClick={() => onNewCall(p.id)} className="text-[#C0392B] hover:text-white transition-colors text-sm font-bold">Start Call</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ObjectionTraining() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHandle, setShowHandle] = useState(false);
  const { playSound } = useSound();
  
  const allObjections = [
    { obj: "We need 360 marketing (but you only do one thing)", handle: "We don't do 360, we only do [X]. Why are you looking for 360 specifically?", gate: "G1" },
    { obj: "I need to talk to my partner", handle: "Of course! Would it make sense to schedule a call with them so they get the same context?", gate: "G2" },
    { obj: "That's too expensive", handle: "If someone charges half — do you think they can deliver the same result? If they could, wouldn't they be charging more?", gate: "G3" },
    { obj: "Maybe next quarter", handle: "Is there something specific happening then, or is it a budget cycle thing?", gate: "G2" }
  ];

  const current = allObjections[currentIdx];

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    speak(current.obj);
  }, [currentIdx]);

  const next = () => {
    playSound('click');
    setCurrentIdx((currentIdx + 1) % allObjections.length);
    setShowHandle(false);
  };

  return (
    <div className="p-12 max-w-2xl mx-auto w-full h-full flex flex-col justify-center relative z-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-['Outfit'] mb-4 premium-gradient-text">Objection Battle Mode</h1>
        <p className="text-[#94949E]">Master the handles. Clear the gates.</p>
      </div>

      <motion.div 
        key={currentIdx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-10 rounded-3xl border border-white/10 glass shadow-2xl relative overflow-hidden text-center min-h-[300px] flex flex-col justify-center"
      >
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold tracking-widest text-[#62626C]">
          OBJECTION {current.gate}
        </div>
        
        <h2 className="text-2xl font-bold mb-8 italic">"{current.obj}"</h2>
        
        <AnimatePresence>
          {showHandle ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] font-medium leading-relaxed"
            >
              <div className="text-[10px] font-bold uppercase mb-2 opacity-60">The Handle</div>
              {current.handle}
            </motion.div>
          ) : (
            <button 
              onClick={() => { setShowHandle(true); playSound('gate'); }}
              className="py-4 px-8 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform"
            >
              Reveal Handle
            </button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-8 flex justify-center gap-4">
        <button onClick={next} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

function Leaderboard() {
  const players = [
    { name: "Jordan 'The Shark'", closed: 42, rate: "92%", points: 12500 },
    { name: "Sarah 'The Closer'", closed: 38, rate: "88%", points: 11200 },
    { name: "You (Karthikeya)", closed: 31, rate: "85%", points: 9400, active: true },
    { name: "Mike 'The Wolf'", closed: 29, rate: "79%", points: 8800 },
    { name: "Alex 'The Strategist'", closed: 25, rate: "75%", points: 7500 },
  ];

  return (
    <div className="p-12 max-w-4xl mx-auto w-full relative z-10">
      <header className="mb-12">
        <h1 className="text-4xl font-bold font-['Outfit'] mb-2 premium-gradient-text">Global Leaderboard</h1>
        <p className="text-[#94949E]">Competing with the top 1% of closers worldwide.</p>
      </header>

      <div className="rounded-3xl border border-white/5 glass overflow-hidden">
        {players.map((p, i) => (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`flex items-center gap-6 p-6 border-b border-white/5 hover:bg-white/5 transition-all ${p.active ? 'bg-white/5' : ''}`}
          >
            <div className="text-2xl font-bold w-8 text-[#52525B]">#{i + 1}</div>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg">
              {p.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-bold flex items-center gap-2">
                {p.name}
                {p.active && <span className="text-[10px] bg-[#FF3B30] px-2 py-0.5 rounded uppercase">You</span>}
              </div>
              <div className="text-xs text-[#52525B]">{p.closed} Gates Closed · {p.rate} Win Rate</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#FF3B30]">{p.points}</div>
              <div className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Points</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
