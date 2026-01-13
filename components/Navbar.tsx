
import React from 'react';
import { Project } from '../types';

interface NavbarProps {
  onImport: (newData: Project[]) => void;
  onSearch: (term: string) => void;
  syncStatus: string;
  projects: Project[];
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onImport, onSearch, syncStatus, isSyncing, projects }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const XLSX = (window as any).XLSX;
        const wb = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        
        const clean = (v: any) => {
          const s = String(v).replace(/,/g, '');
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        };

        const pick = (r: any, ks: string[]) => {
          for (let k in r) {
            for (let key of ks) {
              if (k.toLowerCase().includes(key.toLowerCase())) return r[k];
            }
          }
          return '';
        };

        const newList: Project[] = rows.map((r: any, i: number) => ({
          id: Date.now() + i,
          name: String(pick(r, ['專案', '案名', '工程', '名稱'])).trim(),
          area: clean(pick(r, ['建坪', '面積', 'Area'])),
          originalBudget: clean(pick(r, ['原編', 'Original'])),
          execBudget: clean(pick(r, ['執行', 'Execution'])),
          paid: clean(pick(r, ['請款', '已請', 'Paid']))
        })).filter((p: any) => p.name && !p.name.includes('合計') && !p.name.includes('Total'));

        if (newList.length === 0) {
          alert("未能讀取有效數據，請檢查 Excel 欄位名稱（需包含：專案、建坪、原編、執行、請款）");
        } else {
          onImport(newList);
        }
      } catch (err) {
        console.error("Excel Error:", err);
        alert("Excel 讀取失敗");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (projects.length === 0) return;
    
    const XLSX = (window as any).XLSX;
    const exportData = projects.map(p => {
      const area = p.area || 1;
      const diffAmount = p.execBudget - p.originalBudget;
      return {
        '專案名稱': p.name,
        '總建坪面積': p.area,
        '原編預算(萬)': p.originalBudget,
        '原編預算造價': (p.originalBudget / area).toFixed(1),
        '差異金額(萬)': diffAmount,
        '差異造價': (diffAmount / area).toFixed(1),
        '差異率(%)': (p.originalBudget > 0 ? (diffAmount / p.originalBudget * 100) : 0).toFixed(1),
        '執行預算(萬)': p.execBudget,
        '執行預算造價': (p.execBudget / area).toFixed(1),
        '請款累計(萬)': p.paid,
        '已請款造價': (p.paid / area).toFixed(1),
        '請款佔比(%)': (p.execBudget > 0 ? (p.paid / p.execBudget * 100) : 0).toFixed(1)
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '預算執行監控報表');
    XLSX.writeFile(wb, `工程預算監控_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-wider leading-tight">預算執行監控 Pro</span>
          <span className="text-[9px] text-slate-300 font-bold uppercase">Budget Executive Management</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-48">
          <input 
            type="text" 
            placeholder="搜尋專案名稱..." 
            onChange={e => onSearch(e.target.value)} 
            className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 transition-all pl-8 placeholder-slate-400" 
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex flex-col items-end mr-2">
          <span className={`text-[10px] font-black tracking-tighter ${isSyncing ? 'animate-pulse text-amber-400' : 'text-slate-300'}`}>
            {syncStatus}
          </span>
        </div>

        <button 
          onClick={handleExport}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-600 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="hidden sm:inline">匯出報表</span>
        </button>

        <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span>匯入資料</span>
          <input type="file" onChange={handleFileChange} className="hidden" accept=".xlsx,.xls" />
        </label>
      </div>
    </nav>
  );
};
