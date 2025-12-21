import React, { useState, useEffect, useRef } from 'react';
import { db, DBStats, DBLog } from '../services/dbService';
import { ragService } from '../services/ragService';
import { useAppStore } from '../store/useAppStore';
import { Thought } from '../types';
import {
  Database, Download,
  Upload, ShieldCheck,
  FileJson, Monitor, Terminal, Code
} from 'lucide-react';

const MemoryBank: React.FC = () => {
  const { thoughts, searchQuery, setSearchQuery, refreshThoughts } = useAppStore();
  const [stats, setStats] = useState<DBStats | null>(null);
  const [logs, setLogs] = useState<DBLog[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStats = async () => {
      const s = await db.getStats();
      setStats(s);
    };
    updateStats();
    return db.subscribeLogs(setLogs);
  }, []); // Changed dependency from [thoughts] to [] as thoughts are now from store

  const [filtered, setFiltered] = useState<Thought[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [useSemantic, setUseSemantic] = useState(true);

  useEffect(() => {
    const runSearch = async () => {
      if (!searchQuery.trim()) {
        setFiltered(thoughts);
        return;
      }

      setIsSearching(true);
      try {
        if (useSemantic) {
          const results = await ragService.semanticSearch(searchQuery, thoughts);
          setFiltered(results);
        } else {
          setFiltered(thoughts.filter(t =>
            t.content.toLowerCase().includes(searchQuery.toLowerCase())
          ));
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(runSearch, useSemantic ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, thoughts, useSemantic]);

  const handleBackup = async () => {
    const json = await db.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_orbit_physical_dump_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await db.importFromJSON(event.target?.result as string);
        refreshThoughts();
        alert("Physical Restore Complete!");
      } catch (err) {
        alert("Restore failed: Corrupted dump file.");
      }
    };
    reader.readAsText(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full h-full bg-[#0f172a] border-r border-slate-800 flex flex-col shadow-2xl relative font-mono text-slate-300">
      {/* MySQL Header */}
      <div className="p-6 bg-[#1e293b] border-b border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-xl shadow-blue-500/20">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Local-SQL Workbench</div>
              <div className="text-sm font-bold text-white">LifeOrbit_Sys_v1</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="px-2 py-0.5 bg-green-500/10 text-[9px] font-bold text-green-400 rounded-full flex items-center gap-1 border border-green-500/20">
              <ShieldCheck size={10} /> COMMITTED
            </div>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={handleBackup} className="flex items-center justify-center gap-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-wider">
            <FileJson size={12} /> Dump .sql
          </button>
          <button onClick={handleRestore} className="flex items-center justify-center gap-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-wider">
            <Upload size={12} /> Restore
          </button>
        </div>

        <button onClick={() => setShowInspector(!showInspector)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40">
          <Monitor size={14} /> Open Table Browser
        </button>
        <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".json" />
      </div>

      {/* Query Search */}
      <div className="p-4 bg-[#0f172a]">
        <div className="relative">
          <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SELECT * WHERE content LIKE '%...%'"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-[11px] outline-none focus:border-blue-500 transition-all text-blue-400 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Semantic Toggle */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseSemantic(!useSemantic)}
            className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${useSemantic
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
          >
            {useSemantic ? 'VECTOR SEARCH: ON' : 'VECTOR SEARCH: OFF'}
          </button>
          {isSearching && <span className="text-[9px] text-blue-400 animate-pulse">Computing Embeddings...</span>}
        </div>
      </div>

      {/* Result Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">ResultSet ({filtered.length} rows)</div>
        {filtered.map(t => (
          <div key={t.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg group hover:border-slate-600 transition-all cursor-pointer relative overflow-hidden">
            <div className="flex items-center justify-between mb-1 opacity-50">
              <span className="text-[8px] font-bold text-blue-400 uppercase">{t.level}</span>
              <span className="text-[8px]">0x{t.id.slice(-6)}</span>
            </div>
            <div className={`text-[11px] leading-tight ${t.completed ? 'line-through opacity-30' : 'text-slate-300'}`}>
              {t.content}
            </div>
            {t.similarity !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <div className="h-0.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${t.similarity * 100}%` }} />
                </div>
                <span className="text-[8px] font-mono text-blue-400">{(t.similarity * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Professional Transaction Log */}
      <div className="h-48 border-t border-slate-800 bg-black/40 p-4 flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mb-3">
          <Terminal size={12} /> Transaction Logs
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px]">
          {logs.map(log => (
            <div key={log.id} className="flex gap-2">
              <span className="text-slate-600">[{log.time}]</span>
              <span className={`font-bold ${log.type === 'INSERT' ? 'text-green-400' :
                log.type === 'DELETE' ? 'text-red-400' :
                  log.type === 'QUERY' ? 'text-blue-400' : 'text-amber-400'
                }`}>[{log.type}]</span>
              <span className="text-slate-400 truncate">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Inspector Modal */}
      {showInspector && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-10">
          <div className="bg-[#1e293b] w-full max-w-7xl h-full rounded-2xl shadow-3xl flex flex-col overflow-hidden border border-white/10">
            <div className="p-8 border-b border-slate-700 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl">
                  <Monitor size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Database Inspector <span className="text-blue-500">v2.0</span></h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Connection: Local_IndexedDB_Binary | Path: /dev/sda/user_memories</p>
                </div>
              </div>
              <button onClick={() => setShowInspector(false)} className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                Close Workbench
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-[#0f172a]">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead className="sticky top-0 bg-[#1e293b] border-b border-slate-700 z-10 text-slate-500">
                  <tr>
                    {['PRIMARY_KEY', 'TIMESTAMP', 'DATA_PAYLOAD', 'ORBIT_LEVEL', 'STATUS'].map(h => (
                      <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {thoughts.map(t => (
                    <tr key={t.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-6 py-4 text-slate-500">{t.id}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(t.timestamp).toISOString()}</td>
                      <td className="px-6 py-4 font-sans font-bold text-white max-w-md truncate">{t.content}</td>
                      <td className="px-6 py-4 text-blue-400 font-bold">{t.level}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${t.completed ? 'bg-slate-700 text-slate-400' : 'bg-green-600/20 text-green-400'}`}>
                          {t.completed ? 'INACTIVE' : 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryBank;