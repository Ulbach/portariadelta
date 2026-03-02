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

  // Carregamento de dados com tratamento de erro completo
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
        } catch (e) {
          console.error(`Erro ao carregar empresa ${company}:`, e);
          return [];
        }
      });

      const partnersResults = await Promise.all(partnersPromises);
      setPartners(partnersResults.flat());

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);
      const parsedRecords = sheetService.parseAttendanceRecords(recordsCsv);
      setRecords(parsedRecords);
      
      setError(null);
    } catch (err) {
      console.error('Erro na sincronização:', err);
      if (!silent) {
        setError('Erro ao sincronizar dados. Verifique a conexão e tente novamente.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de estado (Quem está dentro/fora)
  const stayReports = useMemo(() => sheetService.calculateStayReports(records), [records]);
  const activeNow = useMemo(() => stayReports.filter((r) => !r.exitTime), [stayReports]);

  // Lógica de Registro (Entrada/Saída) - Preservando validações
  const handleRegisterAction = async (partnerName: string, type: 'ENTRY' | 'EXIT') => {
    const inside = sheetService.isPartnerInside(records, partnerName);

    if (type === 'ENTRY' && inside) {
      setNotifying('Colaborador já possui entrada ativa.');
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }

    if (type === 'EXIT' && !inside) {
      setNotifying('Colaborador não possui entrada registrada.');
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }

    setNotifying('Sincronizando registro...');

    const p = partners.find(part => part.name.trim().toLowerCase() === partnerName.trim().toLowerCase());
    const company = p?.company || 'Parceiro';

    // Registro otimista na UI
    const tempId = 'temp-' + Date.now();
    const tempRecord: AttendanceRecord = {
      id: tempId,
      partnerId: '',
      partnerName,
      company,
      type,
      timestamp: new Date()
    };

    setRecords(prev => [tempRecord, ...prev]);

    const success = await sheetService.appendRecord({ name: partnerName.trim(), company }, type);

    if (success) {
      setNotifying('Sucesso!');
      setTimeout(() => {
        setNotifying(null);
        loadData(true);
      }, 2000);
      return true;
    } else {
      setRecords(prev => prev.filter(r => r.id !== tempId));
      setNotifying('Falha ao registrar na planilha.');
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }
  };

  const isDashboard = view === ViewMode.DASHBOARD;
  const isWelcome = view === ViewMode.WELCOME;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      {/* Header - Apenas fora da tela Welcome */}
      {!isWelcome && (
        <header className={`relative bg-[#5b806d] text-white px-6 transition-all duration-300 ${isDashboard ? 'pt-12 pb-24 rounded-b-[42px]' : 'py-5 shadow-lg'}`}>
           <div className="flex justify-between items-center relative z-10">
            <div>
              <h1 className="text-xl font-black tracking-tighter">DELTA <span className="font-light opacity-70">PRO</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">Portaria Inteligente</p>
            </div>
            <button 
              onClick={() => loadData()} 
              disabled={loading}
              className={`p-2 rounded-xl bg-white/10 backdrop-blur-md transition-all ${loading ? 'animate-spin' : 'active:scale-95'}`}
            >
              {ICONS.REFRESH}
            </button>
          </div>
        </header>
      )}

      {/* Alertas de Notificação */}
      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
            {notifying}
          </div>
        </div>
      )}

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 overflow-y-auto p-4 no-scrollbar pb-32">
        {error ? (
          <div className="p-10 text-center space-y-4 mt-10">
            <p className="text-sm text-slate-500 font-medium">{error}</p>
            <button onClick={() => loadData()} className="text-xs font-bold text-[#5b806d] uppercase underline tracking-widest">Tentar de novo</button>
          </div>
        ) : (
          <>
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

            {view === ViewMode.REPORTS && (
              <Reports records={records} loading={loading} onBack={() => setView(ViewMode.DASHBOARD)} />
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

            {view === ViewMode.RECORDS && (
              <RecordsList 
                records={records} 
                loading={loading} 
                onRefresh={() => loadData()} 
                onBack={() => setView(ViewMode.DASHBOARD)} 
              />
            )}
          </>
        )}
      </main>

      {/* RODAPÉ: Assinatura e Navegação */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 z-50">
        <div className="text-center mb-3">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold">- By ULBACH -</p>
        </div>
        
        {!isWelcome && (
          <nav className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-around items-center">
            <button 
              onClick={() => setView(ViewMode.DASHBOARD)} 
              className={`p-3 rounded-2xl transition-all ${view === ViewMode.DASHBOARD ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {ICONS.HOME}
            </button>
            <button 
              onClick={() => setView(ViewMode.PARTNERS)} 
              className={`p-3 rounded-2xl transition-all ${view === ViewMode.PARTNERS ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {ICONS.USERS}
            </button>
            <button 
              onClick={() => { setRegistrationInitialTab('NEW'); setView(ViewMode.REGISTRATION); }} 
              className={`p-3 rounded-2xl transition-all ${view === ViewMode.REGISTRATION ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {ICONS.PLUS}
            </button>
            <button 
              onClick={() => setView(ViewMode.REPORTS)} 
              className={`p-3 rounded-2xl transition-all ${view === ViewMode.REPORTS ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {ICONS.REPORT}
            </button>
          </nav>
        )}
      </footer>
    </div>
  );
};

export default App;
