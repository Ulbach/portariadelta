
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, Partner, AttendanceRecord, Company } from './types';
import { ICONS, INITIAL_COMPANIES } from './constants';
import * as firebaseService from './services/firebaseService';
import * as dataUtils from './services/dataUtils';
import Dashboard from './components/Dashboard';
import PartnersList from './components/PartnersList';
import Reports from './components/Reports';
import Registration from './components/Registration';
import RecordsList from './components/RecordsList';
import Welcome from './components/Welcome';
import CompanyManagement from './components/CompanyManagement';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.WELCOME);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrationInitialTab, setRegistrationInitialTab] = useState<'NEW' | 'ACTIVE'>('ACTIVE');
  const [notifying, setNotifying] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (!firebaseService.auth.currentUser) {
        console.log('[App] Skip loading: User not authenticated.');
        return;
      }
      console.log('[App] Loading data from Firebase...');
      
      // Ensure initial data exists
      await firebaseService.seedInitialDataIfEmpty();
      
      // Companies
      let dynamicCompanies: Company[] = [];
      try {
        dynamicCompanies = await firebaseService.fetchCompanies();
      } catch (e) {
        console.error("[App] Failed to fetch companies:", e);
      }
      setCompanies(dynamicCompanies);

      // Partners
      let allPartners: Partner[] = [];
      try {
        allPartners = await firebaseService.fetchPartners();
      } catch (e) {
        console.error("[App] Failed to fetch partners:", e);
      }
      setPartners(allPartners);

      // Records
      let allRecords: AttendanceRecord[] = [];
      try {
        allRecords = await firebaseService.fetchAllAttendanceRecords();
      } catch (e) {
        console.error("[App] Failed to fetch records:", e);
      }
      setRecords(allRecords);
      
      console.log('[App] Data loading complete.', { 
        companies: dynamicCompanies.length, 
        partners: allPartners.length, 
        records: allRecords.length 
      });
    } catch (err: any) {
      console.error("Erro fatal na sincronização Firebase:", err);
      if (!silent) {
        setError("Erro ao sincronizar dados básicos. Verifique sua conexão.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [partners.length]); 

  useEffect(() => {
    const unsubscribe = firebaseService.watchAuth((u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        console.log('[App] User authenticated:', u.email);
        setView(ViewMode.DASHBOARD);
        loadData();
      } else {
        console.log('[App] User not authenticated.');
        setView(ViewMode.WELCOME);
      }
    });
    return () => unsubscribe();
  }, [loadData]);

  const stayReports = useMemo(() => dataUtils.calculateStayReports(records), [records]);
  const activeNow = useMemo(() => stayReports.filter(r => !r.exitTime), [stayReports]);
  const companyNames = useMemo(() => {
    if (companies.length === 0) return INITIAL_COMPANIES;
    return companies.filter(c => c.status === 'Ativa').map(c => c.name);
  }, [companies]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-[#5b806d]/20 border-t-[#5b806d] rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleRegisterAction = async (partnerName: string, type: 'ENTRY' | 'EXIT'): Promise<boolean> => {
    setNotifying("Enviando...");
    
    const p = partners.find(part => part.name.trim().toLowerCase() === partnerName.trim().toLowerCase());
    const company = p?.company || 'Parceiro';
    
    const tempRecord: AttendanceRecord = {
      id: 'temp-' + Date.now(),
      partnerId: p?.id || '',
      partnerName: partnerName,
      company: company,
      type: type,
      timestamp: new Date()
    };
    
    // Atualiza localmente imediato para UX rápida
    setRecords(prev => [tempRecord, ...prev]);

    const success = await firebaseService.appendRecord({
      name: partnerName.trim(),
      company: company
    }, type);
    
    if (success) {
      setNotifying("Registrado!");
      setTimeout(() => { 
        setNotifying(null); 
        loadData(true); 
      }, 1500);
      return true;
    } else {
      setNotifying("Falha no envio.");
      setRecords(prev => prev.filter(r => r.id !== tempRecord.id)); // Remove o temporário se falhar
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }
  };

  const isDashboard = view === ViewMode.DASHBOARD;
  const isWelcome = view === ViewMode.WELCOME;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">
      {!isWelcome && (
        <header className={`relative overflow-hidden text-white px-6 transition-all duration-500 ${isDashboard ? 'pt-14 pb-10 rounded-b-[48px]' : 'py-6 shadow-xl'}`}>
          {/* Background Image & Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5b806d] via-[#5b806d] to-[#436152] transition-all duration-500"></div>
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Modern Building"
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {!isDashboard && (
                  <button 
                    onClick={() => setView(ViewMode.DASHBOARD)} 
                    className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-white/20 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-inner bg-white p-1 backdrop-blur-sm flex items-center justify-center">
                    <img 
                      src="https://raw.githubusercontent.com/ulbach/portaria-inteligente/main/public/logo-delta.png" 
                      alt="Delta Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback if the URL above doesn't work yet
                        e.currentTarget.src = "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=100&h=100&auto=format&fit=crop";
                        e.currentTarget.className = "w-full h-full object-cover rounded-lg grayscale brightness-125";
                      }}
                    />
                  </div>
                  <div>
                    <h1 className={`${isDashboard ? 'text-2xl' : 'text-lg'} font-black leading-tight tracking-tight drop-shadow-sm`}>
                      Portaria Inteligente
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1 h-1 bg-emerald-300 rounded-full animate-pulse"></div>
                      <p className="text-[9px] text-emerald-100/70 uppercase font-black tracking-[0.25em]">Controle de Parceiro</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => loadData()} 
                  disabled={loading} 
                  className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center active:scale-90 border border-white/20 shadow-lg transition-all hover:bg-white/25"
                  title="Atualizar"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button 
                  onClick={() => firebaseService.signOut()} 
                  className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center active:scale-90 border border-white/20 shadow-lg transition-all hover:bg-red-500/20"
                  title="Sair"
                >
                  <ICONS.LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isDashboard && (
              <div className="mt-8 bg-white/95 backdrop-blur-md p-5 rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5b806d] to-[#436152] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#5b806d]/20">
                    <ICONS.Users className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-800 leading-none tracking-tighter">
                      {loading && activeNow.length === 0 ? '...' : activeNow.length}
                    </span>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Presentes Agora</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setRegistrationInitialTab('ACTIVE'); setView(ViewMode.REGISTRATION); }}
                  className="bg-[#5b806d] text-white px-6 py-3 rounded-[18px] text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md hover:brightness-110"
                >
                  Ver Lista
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
            {notifying}
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto ${isDashboard ? 'pt-6' : isWelcome ? 'pt-0' : 'pt-4'} pb-12 p-4 no-scrollbar`}>
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
              {view === ViewMode.PARTNERS && <PartnersList partners={partners} companies={companyNames} activeReports={stayReports} loading={loading} onQuickRegister={handleRegisterAction} onRefresh={() => loadData(true)} onBack={() => setView(ViewMode.DASHBOARD)} onGoToCompanies={() => setView(ViewMode.COMPANIES)} />}
              {view === ViewMode.COMPANIES && <CompanyManagement companies={companies} loading={loading} onRefresh={() => loadData()} onBack={() => setView(ViewMode.DASHBOARD)} />}
              {view === ViewMode.REPORTS && <Reports records={records} partners={partners} loading={loading} onBack={() => setView(ViewMode.DASHBOARD)} />}
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
          <button onClick={() => setView(ViewMode.DASHBOARD)} className={`flex flex-col items-center gap-1 ${view === ViewMode.DASHBOARD ? 'text-[#5b806d]' : 'text-slate-400'}`}>
            <ICONS.Dashboard className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Início</span>
          </button>
          <button onClick={() => setView(ViewMode.PARTNERS)} className={`flex flex-col items-center gap-1 ${view === ViewMode.PARTNERS ? 'text-[#5b806d]' : 'text-slate-400'}`}>
            <ICONS.Building className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Empresas</span>
          </button>
          <button onClick={() => setView(ViewMode.REPORTS)} className={`flex flex-col items-center gap-1 ${view === ViewMode.REPORTS ? 'text-[#5b806d]' : 'text-slate-400'}`}>
            <ICONS.FileText className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Relatórios</span>
          </button>
          <button onClick={() => setView(ViewMode.RECORDS)} className={`flex flex-col items-center gap-1 ${view === ViewMode.RECORDS ? 'text-[#5b806d]' : 'text-slate-400'}`}>
            <ICONS.History className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-tighter">Registros</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
