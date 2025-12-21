import { GoogleGenAI } from "@google/genai";
import { Thought } from "../types";

// Initialize Gemini Client
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class RAGService {
    private static instance: RAGService;

    private constructor() { }

    public static getInstance(): RAGService {
        if (!RAGService.instance) {
            RAGService.instance = new RAGService();
        }
        return RAGService.instance;
    }

    /**
     * Generates a vector embedding for the given text using gemini-embedding model.
     */
    async embedText(text: string): Promise<number[]> {
        try {
            const response = await ai.models.embedContent({
                model: "text-embedding-004",
                content: { parts: [{ text }] },
            });
            // Safety check for null/undefined embedding
            return response.embedding?.values || new Array(768).fill(0);
        } catch (error) {
            console.error("Embedding Error:", error);
            // Return zero vector on failure to prevent crash
            return new Array(768).fill(0);
        }
    }

    /**
     * Calculates Cosine Similarity between two vectors.
     * Returns a value between -1 and 1.
     */
    calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Performs a semantic search over the thoughts.
     * Filters by similarity threshold.
     */
    async semanticSearch(query: string, thoughts: Thought[], limit: number = 5, threshold: number = 0.5): Promise<Thought[]> {
        if (!query.trim()) return [];

        const queryVector = await this.embedText(query);

        // Only search thoughts that have vectors
        const candidates = thoughts.filter(t => t.vector && t.vector.length > 0);

        const results = candidates.map(thought => ({
            thought,
            score: this.calculateCosineSimilarity(queryVector, thought.vector!)
        }));

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        // Filter by threshold and take top N
        return results
            .filter(r => r.score >= threshold)
            .slice(0, limit)
            .map(r => ({ ...r.thought, similarity: r.score })); // Inject similarity for UI if needed
    }
}

export const ragService = RAGService.getInstance();
