
import React from 'react';
import { BudgetSummary } from '../types';

interface SummaryCardsProps {
  summary: BudgetSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const fmt = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 });
  const cards = [
    { label: '總執行預算', val: fmt.format(summary.totalExec), unit: '萬', color: 'border-blue-500' },
    { label: '累計請款額', val: fmt.format(summary.totalPaid), unit: '萬', color: 'border-emerald-500', text: 'text-emerald-700' },
    { label: '整體進度', val: summary.overallProgress.toFixed(1), unit: '%', color: 'border-amber-500', text: 'text-amber-700' },
    { label: '總建坪', val: fmt.format(summary.totalArea), unit: '坪', color: 'border-slate-500' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${c.color} transition-all hover:shadow-md`}>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{c.label}</p>
          <p className={`text-2xl font-bold ${c.text || 'text-slate-900'}`}>
            {c.val}<span className="text-xs font-medium text-slate-500 ml-1 font-sans">{c.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
};
