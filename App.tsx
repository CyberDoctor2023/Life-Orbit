import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Toaster } from 'sonner';

// Components
import OrbitVisualizer from './components/OrbitVisualizer';
import FloatingInput from './components/FloatingInput';
import FutureMirror from './components/FutureMirror';
import MemoryBank from './components/MemoryBank';
import { Thought } from './types';
import { Wand2, Trash2, Brain, CheckCircle2, Cpu, HardDrive, Monitor, Battery, Wifi } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                 LAYOUTS                                    */
/* -------------------------------------------------------------------------- */

const WorkstationLayout: React.FC = () => {
  const {
    thoughts,
    isAnalyzing,
    isLoaded,
    init,
    addThought,
    updateThoughtLevel,
    toggleComplete,
    deleteThought
  } = useAppStore();

  const [hoveredThought, setHoveredThought] = useState<Thought | null>(null);
  const [showMirror, setShowMirror] = useState(false);
  const [time, setTime] = useState(new Date());
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isLoaded) return <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center text-blue-500 font-mono">INITIALIZING_SYSTEM...</div>;

  return (
    <div className="relative w-full h-screen flex flex-col bg-[#0f172a] font-sans overflow-hidden select-none">

      {/* OS Top Title Bar */}
      <div className="h-10 bg-[#1e293b] flex items-center justify-between px-6 border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Monitor size={12} /> Life Orbit Workstation v2.0.0 - Professional
          </div>
        </div>
        <div className="flex items-center gap-6 text-slate-400">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <Wifi size={12} className="text-blue-500" /> ONLINE
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <Battery size={12} /> 100%
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Database Management */}
        <aside className="w-80 h-full hidden xl:block z-40 bg-[#0f172a]">
          <MemoryBank />
        </aside>

        <main className="flex-1 relative flex items-center justify-center p-4">
          <div className="life-orbit-frame relative w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden border border-white/10">

            {/* System Engine Overlay */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-slate-950 shadow-2xl z-30 border border-white/5">
              <div className="flex items-center gap-2">
                <Cpu size={14} className={isAnalyzing ? "text-blue-400 animate-spin" : "text-green-500"} />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  {isAnalyzing ? 'PROCESSING' : 'SYSTEM READY'}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 text-[9px] font-mono text-white/50 uppercase">
                <HardDrive size={10} /> Data: Local_Disk_0
              </div>
            </div>

            <OrbitVisualizer
              thoughts={thoughts}
              width={dimensions.width - (window.innerWidth > 1280 ? 320 : 0) - 32}
              height={dimensions.height - 80}
              onHoverThought={setHoveredThought}
              activeThought={hoveredThought}
              onUpdateLevel={updateThoughtLevel}
            />

            {/* Input Layer */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
              <FloatingInput onAddThought={addThought} isAnalyzing={isAnalyzing} />
            </div>

            <div className="absolute top-12 right-10 z-30">
              <button onClick={() => setShowMirror(true)} className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 shadow-2xl uppercase tracking-widest group">
                <Wand2 size={16} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                Projection
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Insight Panel */}
      {hoveredThought && (
        <div className="fixed right-10 top-1/2 -translate-y-1/2 w-84 z-[60] animate-in fade-in slide-in-from-right-20 duration-500 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-3xl pointer-events-auto text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                LEVEL: {hoveredThought.level}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleComplete(hoveredThought.id)} className={`p-2 rounded-lg transition-all ${hoveredThought.completed ? 'bg-green-600 text-white' : 'bg-white/5 text-white/40 hover:bg-green-600/20 hover:text-green-400'}`}>
                  <CheckCircle2 size={16} />
                </button>
                <button onClick={() => deleteThought(hoveredThought.id)} className="p-2 bg-white/5 text-white/40 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className={`text-2xl font-bold mb-4 leading-tight ${hoveredThought.completed ? 'line-through opacity-30' : ''}`}>
              {hoveredThought.content}
            </h3>
            <div className="p-4 bg-white/5 rounded-xl mb-6 border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/30">
                <Brain size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Local Neural Link</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">"{hoveredThought.reasoning}"</p>
            </div>
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Physical_UUID: {hoveredThought.id}</div>
          </div>
        </div>
      )}

      {/* OS Taskbar Emulator */}
      <div className="h-12 bg-[#020617] flex items-center px-4 gap-2 z-[100] border-t border-white/5 shadow-2xl">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg hover:bg-blue-500 cursor-pointer">
          <Monitor size={16} />
        </div>
        <div className="h-6 w-[1px] bg-white/10 mx-2" />
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-blue-400 hover:bg-white/10 cursor-pointer">
            <Brain size={16} />
          </div>
        </div>
        <div className="flex-1" />
        <div className="px-4 text-[10px] font-mono text-slate-500 font-bold tracking-widest flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ENGINE_READY
          </div>
          <span>MEM: {thoughts.length} Nodes</span>
        </div>
      </div>

      <FutureMirror isOpen={showMirror} onClose={() => setShowMirror(false)} thoughts={thoughts} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                    ROOT                                    */
/* -------------------------------------------------------------------------- */

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" theme="dark" richColors />
      <Routes>
        <Route path="/" element={<WorkstationLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
