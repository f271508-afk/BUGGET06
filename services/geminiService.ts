
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

/**
 * Analyzes construction budget data using Gemini AI
 */
export const analyzeBudget = async (projects: Project[]): Promise<string> => {
  // Initialize Gemini AI client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `分析以下工程數據：${JSON.stringify(projects, null, 2)}。請識別異常項目、計算健康度並提供 3 點專業管理建議（繁體中文）。`;
  
  try {
    // Generate content using gemini-3-flash-preview for text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Extracting text from response (using property .text as per guidelines)
    return response.text || "未能生成分析內容";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
