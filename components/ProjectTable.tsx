
import React from 'react';
import { Project, BudgetSummary } from '../types';

interface ProjectTableProps {
  projects: Project[];
  summary: BudgetSummary;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects }) => {
  const fmt = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 });
  const fmtPct = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
  
  if (projects.length === 0) return (
    <div className="bg-white rounded-xl shadow-sm border p-20 text-center text-slate-600 font-bold">
      <svg className="w-12 h-12 mx-auto mb-4 opacity-40 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
      尚無工程數據，請匯入 Excel 檔案
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse min-w-[1800px]">
          <thead className="bg-slate-900 text-white uppercase text-[11px] font-black tracking-wider">
            <tr>
              <th className="p-4 sticky left-0 z-10 bg-slate-900 border-r border-slate-700 whitespace-nowrap shadow-sm">專案名稱</th>
              <th className="p-4 text-right whitespace-nowrap">總建坪面積</th>
              <th className="p-4 text-right bg-slate-800 whitespace-nowrap">原編預算(萬)</th>
              <th className="p-4 text-right bg-slate-800 whitespace-nowrap">原編造價</th>
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap">差異金額(萬)</th>
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap">差異造價</th>
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap">差異率</th>
              <th className="p-4 text-right bg-blue-900/40 whitespace-nowrap">執行預算(萬)</th>
              <th className="p-4 text-right bg-blue-900/40 whitespace-nowrap">執行造價</th>
              <th className="p-4 text-right bg-emerald-900/40 whitespace-nowrap">請款累計(萬)</th>
              <th className="p-4 text-right bg-emerald-900/40 whitespace-nowrap">已請款造價</th>
              <th className="p-4 text-center whitespace-nowrap">請款佔比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map(p => {
              const area = p.area || 1; // 避免除以 0
              const origCost = p.originalBudget / area;
              const execCost = p.execBudget / area;
              const paidCost = p.paid / area;
              const diffAmount = p.execBudget - p.originalBudget;
              const diffCost = diffAmount / area;
              const diffRate = p.originalBudget > 0 ? (diffAmount / p.originalBudget * 100) : 0;
              const paidRatio = p.execBudget > 0 ? (p.paid / p.execBudget * 100) : 0;

              return (
                <tr key={p.id} className="hover:bg-slate-100 transition-colors group">
                  <td className="p-4 sticky left-0 z-10 bg-white border-r border-slate-200 font-black text-slate-900 group-hover:bg-slate-100">
                    {p.name}
                  </td>
                  <td className="p-4 text-right num-font font-bold text-slate-800">{fmt.format(p.area)}</td>
                  
                  {/* 原編數據 */}
                  <td className="p-4 text-right num-font text-slate-700 font-bold">{fmt.format(p.originalBudget)}</td>
                  <td className="p-4 text-right num-font text-slate-600 italic font-medium">{fmt.format(origCost)}</td>
                  
                  {/* 差異分析 */}
                  <td className={`p-4 text-right num-font font-black ${diffAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {fmt.format(diffAmount)}
                  </td>
                  <td className={`p-4 text-right num-font font-bold ${diffCost > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {fmt.format(diffCost)}
                  </td>
                  <td className={`p-4 text-right num-font font-black ${diffRate > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {fmtPct.format(diffRate)}%
                  </td>
                  
                  {/* 執行數據 */}
                  <td className="p-4 text-right num-font font-black text-slate-900">{fmt.format(p.execBudget)}</td>
                  <td className="p-4 text-right num-font text-blue-800 font-bold">{fmt.format(execCost)}</td>
                  
                  {/* 請款數據 */}
                  <td className="p-4 text-right num-font font-black text-emerald-800">{fmt.format(p.paid)}</td>
                  <td className="p-4 text-right num-font text-emerald-700 font-bold">{fmt.format(paidCost)}</td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-3 min-w-[120px]">
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-300">
                        <div 
                          className={`h-full transition-all duration-700 ${paidRatio > 100 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`} 
                          style={{ width: `${Math.min(paidRatio, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-black w-10 text-right ${paidRatio > 100 ? 'text-rose-700' : 'text-slate-900'}`}>
                        {Math.round(paidRatio)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
