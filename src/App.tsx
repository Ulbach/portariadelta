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
        const csv = await sheetService.fetchSheetCSV(company);
        return sheetService.parsePartners(csv, company);
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
    if (type === 'EXIT' && !inside) { setNotifying('⚠️ Não possui entrada.'); setTimeout(() => setNotifying(null), 3000); return false; }

    setNotifying('🚀 Sincronizando...');
    const p = partners.find(part => part.name.trim().toLowerCase() === partnerName.trim().toLowerCase());
    const company = p?.company || 'Parceiro';
    const tempRecord: AttendanceRecord = { id: 'temp-' + Date.now(), partnerId: '', partnerName, company, type, timestamp: new Date() };
    
    setRecords(prev => [tempRecord, ...prev]);
    const success = await sheetService.appendRecord({ name: partnerName.trim(), company }, type);
    if (success) { setNotifying('✅ Sucesso!'); setTimeout(() => { setNotifying(null); loadData(true); }, 2000); return true; }
    setRecords(prev => prev.filter(r => r.id !== tempRecord.id));
    setNotifying('❌ Erro.'); setTimeout(() => setNotifying(null), 3000); return false;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      {!isWelcome && (
        <header className={`relative bg-[#5b806d] text-white px-6 py-5 ${view === ViewMode.DASHBOARD ? 'pt-12 pb-24 rounded-b-[42px]' : 'shadow-lg'}`}>
          <div className="flex justify-between items-center relative z-10">
            <div><h1 className="text-xl font-black tracking-tighter">DELTA <span className="font-light opacity-70">PRO</span></h1></div>
            <button onClick={() => loadData()} className={`p-2 ${loading ? 'animate-spin' : ''}`}>{ICONS.REFRESH}</button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto p-4 no-scrollbar pb-32">
        {view === ViewMode.WELCOME && <Welcome onStart={() => { setRegistrationInitialTab('ACTIVE'); setView(ViewMode.REGISTRATION); }} />}
        {view === ViewMode.DASHBOARD && <Dashboard activeCount={activeNow.length} records={records.slice(0, 5)} loading={loading} onRefresh={() => loadData()} onNavigateAction={(t) => { setRegistrationInitialTab(t); setView(ViewMode.REGISTRATION); }} />}
        {view === ViewMode.REGISTRATION && <Registration partners={partners} activeReports={activeNow} onRegistered={() => loadData(true)} onQuickRegister={handleRegisterAction} initialTab={registrationInitialTab} onBack={() => setView(ViewMode.DASHBOARD)} />}
        {/* Outras views omitidas por brevidade, mas mantidas no seu código */}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 bg-gradient-to-t from-slate-50 to-transparent z-50">
        <div className="text-center mb-2"><p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold">- By ULBACH -</p></div>
        {view !== ViewMode.WELCOME && (
          <nav className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-around">
            <button onClick={() => setView(ViewMode.DASHBOARD)} className={view === ViewMode.DASHBOARD ? 'bg-[#5b806d] text-white p-3 rounded-2xl' : 'text-slate-400 p-3'}>{ICONS.HOME}</button>
            <button onClick={() => setView(ViewMode.REGISTRATION)} className={view === ViewMode.REGISTRATION ? 'bg-[#5b806d] text-white p-3 rounded-2xl' : 'text-slate-400 p-3'}>{ICONS.PLUS}</button>
          </nav>
        )}
      </footer>
    </div>
  );
};
export default App;
