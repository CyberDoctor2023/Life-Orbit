import { create } from 'zustand';
import { Thought, OrbitLevel } from '../types';
import { db } from '../services/dbService';
import { processWithRealRAG } from '../services/geminiService';
import { toast } from 'sonner';

interface AppState {
    thoughts: Thought[];
    isAnalyzing: boolean;
    searchQuery: string;
    isLoaded: boolean;

    // Actions
    init: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    addThought: (content: string) => Promise<void>;
    updateThoughtLevel: (id: string, level: OrbitLevel) => Promise<void>;
    toggleComplete: (id: string) => Promise<void>;
    deleteThought: (id: string) => Promise<void>;
    refreshThoughts: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    thoughts: [],
    isAnalyzing: false,
    searchQuery: '',
    isLoaded: false,

    init: async () => {
        try {
            await db.init();
            const data = await db.getAll();
            set({ thoughts: data.sort((a, b) => b.timestamp - a.timestamp), isLoaded: true });
        } catch (e) {
            console.error("Failed to init DB", e);
            toast.error("Database Connection Failed");
        }
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    refreshThoughts: async () => {
        const data = await db.getAll();
        set({ thoughts: data.sort((a, b) => b.timestamp - a.timestamp) });
    },

    addThought: async (content: string) => {
        if (!content.trim()) return;

        set({ isAnalyzing: true });
        try {
            // 1. Check Duplicates (Optimistic UI handled by toast)
            const existing = get().thoughts;
            const result = await processWithRealRAG(content, existing);

            if (result.isDuplicate) {
                toast.warning("Duplicate Thought Detected", {
                    description: "This thought already exists in your orbit."
                });
                return;
            }

            const newThought: Thought = {
                id: `REC_${Date.now()}`,
                content,
                level: result.level,
                reasoning: result.reasoning,
                timestamp: Date.now(),
                completed: false,
                vector: result.vector,
                connections: result.retrievedMemories.map(m => m.id)
            };

            await db.save(newThought);
            set(state => ({ thoughts: [newThought, ...state.thoughts] }));

            toast.success("Thought Orbiting", {
                description: `Placed in ${result.level} Orbit: ${result.reasoning}`
            });

        } catch (error) {
            console.error(error);
            toast.error("Process Failed", { description: "The neural link was interrupted." });
        } finally {
            set({ isAnalyzing: false });
        }
    },

    updateThoughtLevel: async (id, level) => {
        const thoughts = get().thoughts;
        const thought = thoughts.find(t => t.id === id);
        if (!thought) return;

        const updated = { ...thought, level };
        // Optimistic Update
        set({ thoughts: thoughts.map(t => t.id === id ? updated : t) });

        try {
            await db.save(updated);
            toast.success("Orbit Adjusted", { description: `Moved to ${level} Layer` });
        } catch (e) {
            // Rollback
            set({ thoughts });
            toast.error("Move Failed");
        }
    },

    toggleComplete: async (id) => {
        const thoughts = get().thoughts;
        const thought = thoughts.find(t => t.id === id);
        if (!thought) return;

        const updated = { ...thought, completed: !thought.completed };
        set({ thoughts: thoughts.map(t => t.id === id ? updated : t) });
        await db.save(updated);
    },

    deleteThought: async (id) => {
        // We handle confirmation in UI component usually, but here is logic
        await db.delete(id);
        set(state => ({ thoughts: state.thoughts.filter(t => t.id !== id) }));
        toast.success("Memory Pruned");
    }
}));
