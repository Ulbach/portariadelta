import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, Partner, AttendanceRecord } from './types';
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
      setRecords(sheetService.parseAttendanceRecords(recordsCsv));
      setError(null);
    } catch (err) {
      if (!silent) setError('Erro ao sincronizar dados.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stayReports = useMemo(() => sheetService.calculateStayReports(records), [records]);
  const activeNow = useMemo(() => stayReports.filter((r) => !r.exitTime), [stayReports]);

  const handleRegisterAction = async (partnerName: string, type: 'ENTRY' | 'EXIT') => {
    const inside = sheetService.isPartnerInside(records, partnerName);
    if (type === 'ENTRY' && inside) { setNotifying('⚠️ Já está dentro.'); setTimeout(() => setNotifying(null), 3000); return false; }
    if (type === 'EXIT' && !inside) { setNotifying('⚠️ Sem entrada.'); setTimeout(() => setNotifying(null), 3000); return false; }

    setNotifying('🚀 Sincronizando...');
    const p = partners.find(part => part.name.trim().toLowerCase() === partnerName.trim().toLowerCase());
    const company = p?.company || 'Parceiro';

    const success = await sheetService.appendRecord({ name: partnerName.trim(), company }, type);
    if (success) { 
      setNotifying('✅ Sucesso!'); 
      setTimeout(() => { setNotifying(null); loadData(true); }, 2000); 
      return true; 
    }
    setNotifying('❌ Erro.'); setTimeout(() => setNotifying(null), 3000); return false;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      
      {/* HEADER IGUAL AO PRINT */}
      {view !== ViewMode.WELCOME && (
        <header className="bg-[#5b806d] text-white px-6 py-5 shadow-lg relative z-20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Delta Geração</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-70 font-bold mt-1">Portaria Inteligente</p>
            </div>
            <button onClick={() => loadData()} className={loading ? 'animate-spin' : ''}>{ICONS.REFRESH}</button>
          </div>
        </header>
      )}

      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
          {notifying}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 no-scrollbar pb-40">
        {view === ViewMode.WELCOME && <Welcome onStart={() => { setRegistrationInitialTab('NEW'); setView(ViewMode.REGISTRATION); }} />}
        {view === ViewMode.DASHBOARD && <Dashboard activeCount={activeNow.length} records={records.slice(0, 5)} loading={loading} onRefresh={() => loadData()} onNavigateAction={(t) => { setRegistrationInitialTab(t); setView(ViewMode.REGISTRATION); }} />}
        {view === ViewMode.REGISTRATION && <Registration partners={partners} activeReports={activeNow} onRegistered={() => loadData(true)} onQuickRegister={handleRegisterAction} initialTab={registrationInitialTab} onBack={() => setView(ViewMode.DASHBOARD)} />}
        {view === ViewMode.PARTNERS && <PartnersList partners={partners} companies={companies} activeReports={stayReports} loading={loading} onQuickRegister={handleRegisterAction} onBack={() => setView(ViewMode.DASHBOARD)} />}
        {view === ViewMode.REPORTS && <Reports records={records} loading={loading} onBack={() => setView(ViewMode.DASHBOARD)} />}
        {view === ViewMode.RECORDS && <RecordsList records={records.slice(0, 5)} loading={loading} onRefresh={() => loadData()} onBack={() => setView(ViewMode.DASHBOARD)} />}
      </main>

      {/* RODAPÉ IGUAL AO PRINT (ASSINATURA + NAV) */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 z-50">
        <div className="text-center mb-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">- By ULBACH -</p>
        </div>
        
        {view !== ViewMode.WELCOME && (
          <nav className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-[32px] p-2 flex justify-around items-center">
            <button onClick={() => setView(ViewMode.WELCOME)} className="text-slate-400 p-3 flex flex-col items-center gap-1 group">
              <span className="w-5 h-5 group-active:scale-90 transition-transform">{ICONS.HOME}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter">Início</span>
            </button>
            
            <button onClick={() => setView(ViewMode.DASHBOARD)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all ${view === ViewMode.DASHBOARD ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400'}`}>Painel</button>

            <button onClick={() => setView(ViewMode.PARTNERS)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all ${view === ViewMode.PARTNERS ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400'}`}>Empresas</button>
          </nav>
        )}
      </footer>
    </div>
  );
};

export default App;
