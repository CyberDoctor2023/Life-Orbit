import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface FloatingInputProps {
  onAddThought: (text: string) => Promise<void>;
  isAnalyzing: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ onAddThought, isAnalyzing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAnalyzing) {
      onAddThought(input);
      setInput('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative flex items-center bg-white border border-ink/10 rounded-full px-2 py-2 shadow-xl backdrop-blur-xl group hover:border-ink/20 transition-all"
    >
      <div className="pl-4 pr-2 text-ink/20">
        <Sparkles size={18} />
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Dump a thought, task, or dream..."
        className="flex-1 bg-transparent border-none outline-none text-ink placeholder-ink/20 px-2 py-2 font-medium"
        disabled={isAnalyzing}
      />
      <button
        type="submit"
        disabled={!input.trim() || isAnalyzing}
        className={`
          p-3 rounded-full flex items-center justify-center transition-all
          ${input.trim() 
            ? 'bg-ink text-white hover:bg-slate-700' 
            : 'bg-ink/5 text-ink/10 cursor-not-allowed'}
        `}
      >
        {isAnalyzing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </button>
      
      {/* Status Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-ink/30 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-widest whitespace-nowrap">
        Predicting Synapse Alignment...
      </div>
    </form>
  );
};

export default FloatingInput;