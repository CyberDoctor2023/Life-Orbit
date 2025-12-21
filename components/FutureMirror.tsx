import React, { useState, useEffect } from 'react';
import { X, Flame, Wand2, Loader2, Info } from 'lucide-react';
import { Thought, OrbitLevel } from '../types';
import { generateFutureVision } from '../services/geminiService';

interface FutureMirrorProps {
  isOpen: boolean;
  onClose: () => void;
  thoughts: Thought[];
}

const FutureMirror: React.FC<FutureMirrorProps> = ({ isOpen, onClose, thoughts }) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [burnStarted, setBurnStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const visionThoughts = thoughts.filter(t => t.level === OrbitLevel.VISION);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (burnStarted && timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => (prev ? prev - 1 : 0));
      }, 1000);
    } else if (timeLeft === 0) {
      handleClose(); // Auto close/burn
    }
    return () => clearTimeout(timer);
  }, [burnStarted, timeLeft]);

  const handleGenerate = async () => {
    if (visionThoughts.length === 0) {
        setErrorMsg("Add items to your 'Vision' orbit first.");
        return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = visionThoughts.map(t => t.content);
      const imageUrl = await generateFutureVision(items);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setBurnStarted(true);
        setTimeLeft(180); // 3 minutes
      } else {
        setErrorMsg("Could not generate vision. Please try again.");
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API key")) {
          setErrorMsg("Please select a valid paid API key via the Google AI Studio button.");
      } else {
          setErrorMsg("Failed to gaze into the future. The mirror is cloudy.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGeneratedImage(null);
    setBurnStarted(false);
    setTimeLeft(null);
    setErrorMsg(null);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl bg-space-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <Wand2 size={24} />
             </div>
             <div>
                <h2 className="text-xl font-light text-white">Future Mirror</h2>
                <p className="text-sm text-white/40">Gaze into your potential future.</p>
             </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px]">
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
               <p className="text-amber-400 font-light tracking-widest uppercase text-sm">Weaving Time & Space...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
               <div className="relative rounded-lg overflow-hidden shadow-2xl border border-white/10 group max-h-[60vh] aspect-video">
                  <img src={generatedImage} alt="Future Vision" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent"></div>
               </div>

               {/* Burn Timer */}
               <div className="mt-8 flex items-center gap-3 text-red-400 bg-red-950/30 px-4 py-2 rounded-full border border-red-500/20">
                  <Flame size={18} className="animate-pulse" />
                  <span className="font-mono">{timeLeft !== null ? formatTime(timeLeft) : '0:00'}</span>
                  <span className="text-xs text-red-300/60 uppercase tracking-wide">until memory fades</span>
               </div>
               <p className="mt-4 text-white/30 text-xs max-w-md text-center">
                 "The future is a glimpse, not a dwelling place. Act now to make it real."
               </p>
            </div>
          ) : (
            <div className="text-center max-w-md">
              <p className="text-white/70 mb-8 leading-relaxed">
                The Mirror uses your <strong>{visionThoughts.length} Vision items</strong> to construct a probabilistic visual reality of your future self. 
                <br/><br/>
                <span className="text-amber-400/80 text-sm">Warning: The vision will burn after 3 minutes to prevent daydream addiction.</span>
              </p>

              {errorMsg && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 text-red-200 text-sm rounded-lg">
                      {errorMsg}
                  </div>
              )}

              {visionThoughts.length > 0 ? (
                <button 
                  onClick={handleGenerate}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full transition-all hover:scale-105 shadow-lg shadow-amber-900/20"
                >
                  <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>Ignite the Mirror</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/30">
                   <Info size={32} />
                   <p>Add thoughts to the "Vision" (Outer) orbit to use the mirror.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FutureMirror;