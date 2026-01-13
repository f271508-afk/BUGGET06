
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { ProjectTable } from './components/ProjectTable';
import { Project } from './types';
import { initializeFirebase, saveToCloud, listenToCloud, isFirebaseActive } from './services/firebaseService';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState('初始化中...');
  const [isSyncing, setIsSyncing] = useState(false);

  // 初始化：優先從本地存檔載入，再同步雲端
  useEffect(() => {
    // 1. 嘗試從本地 localStorage 載入快取
    const cachedData = localStorage.getItem('construction_projects_cache');
    if (cachedData) {
      try {
        setProjects(JSON.parse(cachedData));
        setSyncStatus('載入本地存檔');
      } catch (e) {
        console.error("Failed to parse local cache");
      }
    }

    const init = async () => {
      try {
        const user = await initializeFirebase();
        
        if (!isFirebaseActive()) {
          setSyncStatus(cachedData ? '本地存檔 (離線)' : '離線模式');
          return;
        }

        setSyncStatus('雲端連線中...');
        
        const unsubscribe = listenToCloud((data) => {
          if (data && data.length > 0) {
            setProjects(data);
            // 同步更新本地快取
            localStorage.setItem('construction_projects_cache', JSON.stringify(data));
          }
          setSyncStatus('雲端同步中');
        }, (err) => {
          console.error("Firebase sync error", err);
          setSyncStatus('雲端連線失敗');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Initialization error", error);
        setSyncStatus('驗證錯誤');
      }
    };

    init();
  }, []);

  // 匯入處理：自動執行存檔 (本地 + 雲端)
  const handleImport = async (newData: Project[]) => {
    setIsSyncing(true);
    setSyncStatus('正在存檔...');
    
    try {
      // 1. 立即更新本地狀態與快取 (確保速度)
      setProjects(newData);
      localStorage.setItem('construction_projects_cache', JSON.stringify(newData));

      // 2. 嘗試同步至雲端
      if (isFirebaseActive()) {
        await saveToCloud(newData);
        setSyncStatus('已完成自動存檔');
      } else {
        setSyncStatus('已儲存至本地');
      }
    } catch (error) {
      console.error("Auto-save failed", error);
      setSyncStatus('存檔失敗');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const summary = useMemo(() => {
    const totalExec = projects.reduce((sum, p) => sum + p.execBudget, 0);
    const totalPaid = projects.reduce((sum, p) => sum + p.paid, 0);
    const totalArea = projects.reduce((sum, p) => sum + p.area, 0);
    const totalOriginal = projects.reduce((sum, p) => sum + p.originalBudget, 0);
    const overallProgress = totalExec > 0 ? (totalPaid / totalExec * 100) : 0;

    return { totalExec, totalPaid, totalArea, totalOriginal, overallProgress };
  }, [projects]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <Navbar 
        onImport={handleImport} 
        onSearch={setSearchTerm} 
        syncStatus={syncStatus} 
        projects={projects}
        isSyncing={isSyncing}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SummaryCards summary={summary} />
        
        <div className="w-full space-y-6">
           <ProjectTable projects={filteredProjects} summary={summary} />
        </div>
      </main>
    </div>
  );
};

export default App;
