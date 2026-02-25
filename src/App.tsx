
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, Partner, AttendanceRecord, StayReport } from './types';
import { ICONS, INITIAL_COMPANIES, DATA_TAB_NAME } from './constants';
import * as sheetService from './services/sheetService';
import Dashboard from './components/Dashboard';
import PartnersList from './components/PartnersList';
import Reports from './components/Reports';
import Registration from './components/Registration';
import RecordsList from './components/RecordsList';
import Welcome from './components/Welcome';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.WELCOME);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [companies, setCompanies] = useState<string[]>(INITIAL_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationInitialTab, setRegistrationInitialTab] = useState<'NEW' | 'ACTIVE'>('ACTIVE');
  const [notifying, setNotifying] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dynamicCompanies = await sheetService.fetchCompanies();
      const currentCompanies = dynamicCompanies.length > 0 ? dynamicCompanies : INITIAL_COMPANIES;
      setCompanies(currentCompanies);

      const partnersPromises = currentCompanies.map(async (company) => {
        try {
          const csv = await sheetService.fetchSheetCSV(company);
          return sheetService.parsePartners(csv, company);
        } catch (e) { return []; }
      });
      const partnersResults = await Promise.all(partnersPromises);
      setPartners(partnersResults.flat());

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);
      const parsedRecords = sheetService.parseAttendanceRecords(recordsCsv);
      
      setRecords(parsedRecords);
      setError(null);
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
      if (!silent) {
        setError("Erro ao sincronizar dados. Verifique se a planilha está compartilhada corretamente e se o Apps Script está publicado.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const stayReports = useMemo(() => sheetService.calculateStayReports(records), [records]);
  const activeNow = useMemo(() => stayReports.filter(r => !r.exitTime), [stayReports]);

  const handleRegisterAction = async (partnerName: string, type: 'ENTRY' | 'EXIT') => {
    setNotifying("Enviando...");
    
    const p = partners.find(part => part.name.trim().toLowerCase() === partnerName.trim().toLowerCase());
    const company = p?.company || 'Parceiro';
    
    const tempId = 'temp-' + Date.now();
    const tempRecord: AttendanceRecord = {
      id: tempId,
      partnerId: '',
      partnerName: partnerName,
      company: company,
      type: type,
      timestamp: new Date()
    };

    const success = await sheetService.appendRecord({
      name: partnerName.trim(),
      company: company
    }, type);
    
    if (success) {
      setRecords(prev => [tempRecord, ...prev]);
      setNotifying("Registrado na nuvem!");
      
      setTimeout(() => { 
        setNotifying(null); 
        loadData(true); 
      }, 7000);
      return true;
    } else {
      setNotifying("Falha no envio.");
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }
  };

  const isDashboard = view === ViewMode.DASHBOARD;
  const isWelcome = view === ViewMode.WELCOME;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      {!isWelcome && (
        <header className={`relative bg-[#5b806d] text-white px-6 transition-all duration-300 ${isDashboard ? 'pt-12 pb-24 rounded-b-[42px]' : 'py-5 shadow-lg'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!isDashboard && (
                <button onClick={() => setView(ViewMode.DASHBOARD)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div>
                <h1 className={`${isDashboard ? 'text-2xl' : 'text-lg'} font-black leading-tight tracking-tight`}>Portaria Inteligente</h1>
                <p className="text-[9px] text-emerald-100/60 uppercase font-black tracking-[0.25em] mt-0.5">Controle de Parceiro</p>
              </div>
            </div>
            <button onClick={() => loadData()} disabled={loading} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-90 border border-white/10">
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {isDashboard && (
            <div className="absolute -bottom-8 left-6 right-6">
              <div className="bg-white p-5 rounded-[32px] shadow-xl flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-[#5b806d]/10 text-[#5b806d] rounded-2xl flex items-center justify-center">
                    <ICONS.Users className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-800 leading-none">
                      {loading && activeNow.length === 0 ? '...' : activeNow.length}
                    </span>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Presentes Agora</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setRegistrationInitialTab('ACTIVE'); setView(ViewMode.REGISTRATION); }}
                  className="bg-slate-50 text-slate-500 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all border border-slate-200/50"
                >
                  Ver Lista
                </button>
              </div>
            </div>
          )}
        </header>
      )}

      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
            {notifying}
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto ${isDashboard ? 'pt-14' : isWelcome ? 'pt-0' : 'pt-4'} pb-12 p-4 no-scrollbar`}>
        {error ? (
          <div className="p-10 text-center space-y-4 mt-10">
             <p className="text-sm text-slate-500 font-medium">{error}</p>
             <button onClick={() => loadData()} className="text-xs font-bold text-[#5b806d] uppercase underline tracking-widest">Tentar de novo</button>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="flex-1">
              {view === ViewMode.WELCOME && <Welcome onStart={() => setView(ViewMode.DASHBOARD)} />}
              {view === ViewMode.DASHBOARD && <Dashboard activeCount={activeNow.length} records={records} loading={loading} onRefresh={() => loadData()} onNavigateAction={(t) => { setRegistrationInitialTab(t); setView(ViewMode.REGISTRATION); }} />}
              {view === ViewMode.PARTNERS && <PartnersList partners={partners} companies={companies} activeReports={stayReports} loading={loading} onQuickRegister={handleRegisterAction} onBack={() => setView(ViewMode.DASHBOARD)} />}
              {view === ViewMode.REPORTS && <Reports records={records} loading={loading} onBack={() => setView(ViewMode.DASHBOARD)} />}
              {view === ViewMode.REGISTRATION && <Registration partners={partners} activeReports={activeNow} onRegistered={() => loadData(true)} onQuickRegister={handleRegisterAction} initialTab={registrationInitialTab} onBack={() => setView(ViewMode.DASHBOARD)} />}
              {view === ViewMode.RECORDS && <RecordsList records={records} loading={loading} onRefresh={() => loadData()} onBack={() => setView(ViewMode.DASHBOARD)} />}
              
              {/* ASSINATURA EM TODAS AS PÁGINAS */}
              <div className="py-12 flex justify-center items-center opacity-30 select-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">- BY ULBACH -</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ SOMENTE NO DASHBOARD */}
      {view === ViewMode.DASHBOARD && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-3 z-20 safe-area-bottom shadow-2xl rounded-t-[32px] animate-in slide-in-from-bottom-full duration-300">
          <button onClick={() => setView(ViewMode.WELCOME)} className="flex flex-col items-center gap-1 text-[#5b806d]">
            <ICONS.Dashboard className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Início</span>
          </button>
          <button onClick={() => setView(ViewMode.PARTNERS)} className="flex flex-col items-center gap-1 text-slate-400">
            <ICONS.Users className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Empresas</span>
          </button>
          <button onClick={() => setView(ViewMode.REPORTS)} className="flex flex-col items-center gap-1 text-slate-400">
            <ICONS.FileText className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Relatórios</span>
          </button>
          <button onClick={() => setView(ViewMode.RECORDS)} className="flex flex-col items-center gap-1 text-slate-400">
            <ICONS.History className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Registros</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
