import { GoogleGenAI, Type } from "@google/genai";
import { OrbitLevel, Thought } from "../types";
import { ragService } from "./ragService";

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const processWithRealRAG = async (
  newThought: string,
  history: Thought[]
): Promise<{
  level: OrbitLevel;
  reasoning: string;
  retrievedMemories: Thought[];
  vector: number[];
  isDuplicate: boolean;
}> => {
  // Use centralized RAG service for embedding
  const currentVector = await ragService.embedText(newThought);

  // Use centralized RAG service for similarity calculation
  const rankedHistory = history
    .filter(t => t.vector)
    .map(t => ({
      ...t,
      similarity: ragService.calculateCosineSimilarity(currentVector, t.vector!)
    }))
    .sort((a, b) => b.similarity! - a.similarity!);

  const retrieved = rankedHistory.slice(0, 5);
  const isDuplicate = retrieved.length > 0 && retrieved[0].similarity! > 0.96;

  const contextText = retrieved
    .map(t => `[关联度: ${(t.similarity! * 100).toFixed(0)}%] ${t.content}`)
    .join("\n");

  const prompt = `
    你是一个具备 RAG 能力的“海马体”大脑。
    
    【新想法】： "${newThought}"
    
    【已检索的相关记忆】：
    ${contextText || "无历史。"}
    
    【任务】：
    1. 基于相关记忆，分析该想法在用户生命轨道中的位置。
    2. 分类：SURVIVAL (琐事/当前), GROWTH (技能/项目), VISION (长期愿景)。
    3. 给出一个简短的、充满洞见的分类推理。
    
    返回 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, enum: [OrbitLevel.SURVIVAL, OrbitLevel.GROWTH, OrbitLevel.VISION] },
            reasoning: { type: Type.STRING }
          },
          required: ["level", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      retrievedMemories: retrieved,
      vector: currentVector,
      isDuplicate
    };
  } catch (error) {
    return {
      level: OrbitLevel.SURVIVAL,
      reasoning: "系统繁忙，默认分类。",
      retrievedMemories: retrieved,
      vector: currentVector,
      isDuplicate
    };
  }
};

export const generateFutureVision = async (visionItems: string[]): Promise<string | null> => {
  if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
    await window.aistudio.openSelectKey();
  }
  const prompt = `Hyper-realistic future lifestyle based on: ${visionItems.join(", ")}. Soft cinematic lighting, high quality, 16:9 aspect ratio.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
  });
  const data = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
  return data ? `data:image/png;base64,${data}` : null;
};
