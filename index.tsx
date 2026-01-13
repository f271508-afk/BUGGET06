
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- Types ---
interface Project {
  id: string | number;
  name: string;
  area: number;
  originalBudget: number;
  execBudget: number;
  paid: number;
}

interface BudgetSummary {
  totalExec: number;
  totalPaid: number;
  totalArea: number;
  totalOriginal: number;
  overallProgress: number;
}

// --- Firebase Service Logic ---
const getFirebaseConfig = () => {
  try {
    const config = (window as any).__firebase_config;
    if (!config) return null;
    return typeof config === 'string' ? JSON.parse(config) : config;
  } catch (e) { return null; }
};

const appId = (window as any).__app_id || 'construction-budget-pro-v2';
let fbDb: any = null;
let isFirebaseActive = false;

// --- Components ---

const SummaryCards: React.FC<{ summary: BudgetSummary }> = ({ summary }) => {
  const fmt = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 });
  const cards = [
    { label: '總執行預算', val: fmt.format(summary.totalExec), unit: '萬', color: 'border-blue-500' },
    { label: '累計請款額', val: fmt.format(summary.totalPaid), unit: '萬', color: 'border-emerald-600', text: 'text-emerald-800' },
    { label: '整體進度', val: summary.overallProgress.toFixed(1), unit: '%', color: 'border-amber-500', text: 'text-amber-800' },
    { label: '總建坪', val: fmt.format(summary.totalArea), unit: '坪', color: 'border-slate-600' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${c.color} transition-all hover:shadow-md`}>
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">{c.label}</p>
          <p className={`text-2xl font-black ${c.text || 'text-slate-900'}`}>
            {c.val}<span className="text-xs font-bold text-slate-600 ml-1 font-sans">{c.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

const ProjectTable: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const fmt = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 });
  const fmtPct = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
  
  if (projects.length === 0) return (
    <div className="bg-white rounded-xl shadow-sm border p-20 text-center text-slate-800 font-black">
      <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
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
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap text-amber-50">差異金額(萬)</th>
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap text-amber-50">差異造價</th>
              <th className="p-4 text-right bg-amber-900/40 whitespace-nowrap text-amber-50">差異率</th>
              <th className="p-4 text-right bg-blue-900/40 whitespace-nowrap text-blue-50">執行預算(萬)</th>
              <th className="p-4 text-right bg-blue-900/40 whitespace-nowrap text-blue-50">執行造價</th>
              <th className="p-4 text-right bg-emerald-900/40 whitespace-nowrap text-emerald-50">請款累計(萬)</th>
              <th className="p-4 text-right bg-emerald-900/40 whitespace-nowrap text-emerald-50">已請款造價</th>
              <th className="p-4 text-center whitespace-nowrap">請款佔比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map(p => {
              const area = p.area || 1;
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
                  <td className="p-4 text-right num-font font-black text-slate-800">{fmt.format(p.area)}</td>
                  <td className="p-4 text-right num-font text-slate-700 font-black">{fmt.format(p.originalBudget)}</td>
                  <td className="p-4 text-right num-font text-slate-600 italic font-bold">{fmt.format(origCost)}</td>
                  <td className={`p-4 text-right num-font font-black ${diffAmount > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>{fmt.format(diffAmount)}</td>
                  <td className={`p-4 text-right num-font font-bold ${diffCost > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{fmt.format(diffCost)}</td>
                  <td className={`p-4 text-right num-font font-black ${diffRate > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>{fmtPct.format(diffRate)}%</td>
                  <td className="p-4 text-right num-font font-black text-slate-900">{fmt.format(p.execBudget)}</td>
                  <td className="p-4 text-right num-font text-blue-900 font-black">{fmt.format(execCost)}</td>
                  <td className="p-4 text-right num-font font-black text-emerald-900">{fmt.format(p.paid)}</td>
                  <td className="p-4 text-right num-font text-emerald-800 font-black">{fmt.format(paidCost)}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3 min-w-[120px]">
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-300">
                        <div className={`h-full transition-all duration-700 ${paidRatio > 100 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`} style={{ width: `${Math.min(paidRatio, 100)}%` }}></div>
                      </div>
                      <span className={`text-[11px] font-black w-10 text-right ${paidRatio > 100 ? 'text-rose-800' : 'text-slate-900'}`}>{Math.round(paidRatio)}%</span>
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

const Navbar: React.FC<{ onImport: (d: Project[]) => void, onSearch: (s: string) => void, syncStatus: string, projects: Project[], isSyncing: boolean }> = ({ onImport, onSearch, syncStatus, isSyncing, projects }) => {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const XLSX = (window as any).XLSX;
        const wb = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        const clean = (v: any) => parseFloat(String(v).replace(/,/g, '')) || 0;
        const pick = (r: any, ks: string[]) => {
          for (let k in r) for (let key of ks) if (k.toLowerCase().includes(key.toLowerCase())) return r[k];
          return '';
        };
        const newList = rows.map((r: any, i: number) => ({
          id: Date.now() + i,
          name: String(pick(r, ['專案', '案名', '工程', '名稱'])).trim(),
          area: clean(pick(r, ['建坪', '面積', 'Area'])),
          originalBudget: clean(pick(r, ['原編', 'Original'])),
          execBudget: clean(pick(r, ['執行', 'Execution'])),
          paid: clean(pick(r, ['請款', '已請', 'Paid']))
        })).filter(p => p.name && !p.name.includes('合計'));
        if (newList.length > 0) onImport(newList);
      } catch (err) { alert("讀取失敗"); }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (projects.length === 0) return;
    const XLSX = (window as any).XLSX;
    const exportData = projects.map(p => ({
      '專案名稱': p.name, '總建坪': p.area, '原編預算': p.originalBudget, '執行預算': p.execBudget, '請款累計': p.paid
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '報表');
    XLSX.writeFile(wb, `工程監控_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
        <div className="flex flex-col"><span className="font-black tracking-wider leading-tight">預算執行監控 Pro</span><span className="text-[9px] text-slate-300 font-black uppercase">Budget Executive Management</span></div>
      </div>
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-48">
          <input type="text" placeholder="搜尋專案..." onChange={e => onSearch(e.target.value)} className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 pl-8 text-white placeholder-slate-400" />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <span className={`text-[10px] font-black ${isSyncing ? 'animate-pulse text-amber-400' : 'text-slate-300'}`}>{syncStatus}</span>
        <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-xs font-black border border-slate-600 shadow-sm hidden sm:block">匯出報表</button>
        <label className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-black cursor-pointer shadow-md flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span>匯入資料</span><input type="file" onChange={handleFile} className="hidden" accept=".xlsx,.xls" />
        </label>
      </div>
    </nav>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState('初始化...');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. 本地載入
    const cached = localStorage.getItem('construction_projects_cache');
    if (cached) {
      try { setProjects(JSON.parse(cached)); setSyncStatus('已載入本地存檔'); } catch (e) {}
    }

    // 2. Firebase 初始化
    const config = getFirebaseConfig();
    if (config?.apiKey && config.apiKey !== "undefined") {
      try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        fbDb = getFirestore(app);
        isFirebaseActive = true;
        signInAnonymously(auth).then(() => {
          const ref = doc(fbDb, 'artifacts', appId, 'public', 'data', 'projects', 'main');
          onSnapshot(ref, (snap) => {
            if (snap.exists()) {
              const data = snap.data().list || [];
              setProjects(data);
              localStorage.setItem('construction_projects_cache', JSON.stringify(data));
              setSyncStatus('雲端已同步');
            }
          });
        });
      } catch (e) { setSyncStatus('離線模式'); }
    } else {
      setSyncStatus('離線模式');
    }
  }, []);

  const handleImport = async (newData: Project[]) => {
    setIsSyncing(true);
    setProjects(newData);
    localStorage.setItem('construction_projects_cache', JSON.stringify(newData));
    if (isFirebaseActive && fbDb) {
      try {
        const ref = doc(fbDb, 'artifacts', appId, 'public', 'data', 'projects', 'main');
        await setDoc(ref, { list: newData, updatedAt: new Date().toISOString() });
        setSyncStatus('自動存檔完成');
      } catch (e) { setSyncStatus('雲端同步失敗'); }
    }
    setIsSyncing(false);
  };

  const filtered = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [projects, searchTerm]);
  const summary = useMemo(() => {
    const totalExec = projects.reduce((s, p) => s + p.execBudget, 0);
    const totalPaid = projects.reduce((s, p) => s + p.paid, 0);
    const totalArea = projects.reduce((s, p) => s + p.area, 0);
    const totalOriginal = projects.reduce((s, p) => s + p.originalBudget, 0);
    return { totalExec, totalPaid, totalArea, totalOriginal, overallProgress: totalExec > 0 ? (totalPaid / totalExec * 100) : 0 };
  }, [projects]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-medium">
      <Navbar onImport={handleImport} onSearch={setSearchTerm} syncStatus={syncStatus} projects={projects} isSyncing={isSyncing} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SummaryCards summary={summary} />
        <ProjectTable projects={filtered} />
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
