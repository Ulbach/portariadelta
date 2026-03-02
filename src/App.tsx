import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, Partner, AttendanceRecord } from './types';
import { ICONS, DATA_TAB_NAME, INITIAL_COMPANIES } from './constants';
import * as sheetService from './services/sheetService';
import Dashboard from './components/Dashboard';
import PartnersList from './components/PartnersList';
import Reports from './components/Reports';
import Registration from './components/Registration';
import Welcome from './components/Welcome';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.WELCOME);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [companies, setCompanies] = useState<string[]>(INITIAL_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [registrationInitialTab, setRegistrationInitialTab] = useState<'NEW' | 'ACTIVE'>('ACTIVE');
  const [notifying, setNotifying] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dynamicCompanies = await sheetService.fetchCompanies();
      setCompanies(dynamicCompanies);

      const partnersPromises = dynamicCompanies.map(async (company) => {
        const csv = await sheetService.fetchSheetCSV(company);
        return sheetService.parsePartners(csv, company);
      });

      const partnersResults = await Promise.all(partnersPromises);
      setPartners(partnersResults.flat());

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);
      setRecords(sheetService.parseAttendanceRecords(recordsCsv));
    } catch (err) {
      console.error("Erro ao carregar dados da planilha.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stayReports = useMemo(() => sheetService.calculateStayReports(records), [records]);
  const activeNow = useMemo(() => stayReports.filter((r) => !r.exitTime), [stayReports]);

  const handleRegisterAction = async (partnerName: string, type: 'ENTRY' | 'EXIT') => {
    const success = await sheetService.appendRecord({ 
      name: partnerName, 
      company: partners.find(p => p.name === partnerName)?.company || 'Parceiro' 
    }, type);
    if (success) loadData(true);
    return success;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      {view !== ViewMode.WELCOME && (
        <header className="bg-[#5b806d] text-white px-6 py-5 shadow-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black tracking-tighter">DELTA PRO</h1>
            <button onClick={() => loadData()} className={loading ? 'animate-spin' : ''}>{ICONS.REFRESH}</button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto p-4 no-scrollbar pb-36">
        {view === ViewMode.WELCOME && (
          <Welcome onStart={() => { setRegistrationInitialTab('NEW'); setView(ViewMode.REGISTRATION); }} />
        )}
        
        {view === ViewMode.DASHBOARD && (
          <Dashboard 
            activeCount={activeNow.length} 
            records={records.slice(0, 5)} 
            loading={loading} 
            onRefresh={() => loadData()} 
            onNavigateAction={(t) => { setRegistrationInitialTab(t); setView(ViewMode.REGISTRATION); }} 
          />
        )}

        {view === ViewMode.REGISTRATION && (
          <Registration 
            partners={partners} 
            activeReports={activeNow} 
            onRegistered={() => loadData(true)} 
            onQuickRegister={handleRegisterAction} 
            initialTab={registrationInitialTab} 
            onBack={() => setView(ViewMode.DASHBOARD)} 
          />
        )}

        {view === ViewMode.PARTNERS && (
          <PartnersList 
            partners={partners} 
            companies={companies} 
            activeReports={stayReports} 
            loading={loading} 
            onQuickRegister={handleRegisterAction} 
            onBack={() => setView(ViewMode.DASHBOARD)} 
          />
        )}
      </main>

      {/* RODAPÉ FINAL */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 z-50">
        <div className="text-center mb-2">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold">- By ULBACH -</p>
        </div>
        
        {view !== ViewMode.WELCOME && (
          <nav className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-around items-center">
            <button onClick={() => setView(ViewMode.WELCOME)} className="text-slate-400 p-3 flex flex-col items-center gap-1">
              <span className="w-5 h-5">{ICONS.HOME}</span>
              <span className="text-[8px] font-bold uppercase">Início</span>
            </button>
            
            <button onClick={() => setView(ViewMode.DASHBOARD)} className={`p-3 rounded-2xl ${view === ViewMode.DASHBOARD ? 'bg-[#5b806d] text-white' : 'text-slate-400'}`}>
              <span className="text-[10px] font-black uppercase px-2">Painel</span>
            </button>

            <button onClick={() => setView(ViewMode.PARTNERS)} className={`p-3 rounded-2xl ${view === ViewMode.PARTNERS ? 'bg-[#5b806d] text-white' : 'text-slate-400'}`}>
              <span className="text-[10px] font-black uppercase px-2">Empresas</span>
            </button>
          </nav>
        )}
      </footer>
    </div>
  );
};

export default App;
