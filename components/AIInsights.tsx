
import React, { useState } from 'react';
import { Project } from '../types';
import { analyzeBudget } from '../services/geminiService';

interface AIInsightsProps {
  projects: Project[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ projects }) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  // Calls the analyzeBudget service
  const handleAnalyze = async () => {
    if (projects.length === 0) return;
    setLoading(true);
    try {
      const result = await analyzeBudget(projects);
      setInsight(result);
    } catch (e) {
      setInsight("分析失敗，請檢查 API Key 或網路連線。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
        <h3 className="font-black text-slate-900 text-sm tracking-tight">Gemini 智能分析</h3>
        <button 
          onClick={handleAnalyze} 
          disabled={loading || !projects.length} 
          className="bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? '分析中...' : '生成報告'}
        </button>
      </div>
      <div className="p-5 text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap overflow-y-auto flex-1">
        {insight || (loading ? '正在分析數據...' : '點擊按鈕生成分析報告。')}
      </div>
    </div>
  );
};
