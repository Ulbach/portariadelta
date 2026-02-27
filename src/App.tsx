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
  const [registrationInitialTab, setRegistrationInitialTab] =
    useState<'NEW' | 'ACTIVE'>('ACTIVE');
  const [notifying, setNotifying] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dynamicCompanies = await sheetService.fetchCompanies();
      const currentCompanies =
        dynamicCompanies.length > 0 ? dynamicCompanies : INITIAL_COMPANIES;
      setCompanies(currentCompanies);

      const partnersPromises = currentCompanies.map(async (company) => {
        try {
          const csv = await sheetService.fetchSheetCSV(company);
          return sheetService.parsePartners(csv, company);
        } catch {
          return [];
        }
      });
      const partnersResults = await Promise.all(partnersPromises);
      setPartners(partnersResults.flat());

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);
      const parsedRecords =
        sheetService.parseAttendanceRecords(recordsCsv);

      setRecords(parsedRecords);
      setError(null);
    } catch (err) {
      console.error('Erro na sincronização:', err);
      if (!silent) {
        setError(
          'Erro ao sincronizar dados. Verifique se a planilha está compartilhada corretamente e se o Apps Script está publicado.'
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const stayReports = useMemo(
    () => sheetService.calculateStayReports(records),
    [records]
  );

  const activeNow = useMemo(
    () => stayReports.filter((r) => !r.exitTime),
    [stayReports]
  );

  /* =====================================================
     🔐 REGRA DE NEGÓCIO – VALIDAÇÃO CIRÚRGICA
  ===================================================== */
  const handleRegisterAction = async (
    partnerName: string,
    type: 'ENTRY' | 'EXIT'
  ) => {
    const inside = sheetService.isPartnerInside(records, partnerName);

    if (type === 'ENTRY' && inside) {
      setNotifying('Colaborador já está dentro.');
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }

    if (type === 'EXIT' && !inside) {
      setNotifying('Colaborador não está dentro.');
      setTimeout(() => setNotifying(null), 3000);
      return false;
    }

    setNotifying('Enviando...');

    const p = partners.find(
      (part) =>
        part.name.trim().toLowerCase() ===
        partnerName.trim().toLowerCase()
    );
    const company = p?.company || 'Parceiro';

    const tempRecord: AttendanceRecord = {
      id: 'temp-' + Date.now(),
      partnerId: '',
      partnerName,
      company,
      type,
      timestamp: new Date()
    };

    const success = await sheetService.appendRecord(
      { name: partnerName.trim(), company },
      type
    );

    if (success) {
      setRecords((prev) => [tempRecord, ...prev]);
      setNotifying('Registrado na nuvem!');
      setTimeout(() => {
        setNotifying(null);
        loadData(true);
      }, 7000);
      return true;
    } else {
      setNotifying('Falha no envio.');
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
          {/* HEADER INTACTO */}
        </header>
      )}

      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
            {notifying}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-4 pb-12 p-4 no-scrollbar">
        {error ? (
          <div className="p-10 text-center space-y-4 mt-10">
            <p className="text-sm text-slate-500 font-medium">{error}</p>
            <button
              onClick={() => loadData()}
              className="text-xs font-bold text-[#5b806d] uppercase underline tracking-widest"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            {view === ViewMode.WELCOME && (
              <Welcome onStart={() => setView(ViewMode.DASHBOARD)} />
            )}
            {view === ViewMode.DASHBOARD && (
              <Dashboard
                activeCount={activeNow.length}
                records={records.slice(0, 5)}
                loading={loading}
                onRefresh={() => loadData()}
                onNavigateAction={(t) => {
                  setRegistrationInitialTab(t);
                  setView(ViewMode.REGISTRATION);
                }}
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
              <Reports
                records={records}
                loading={loading}
                onBack={() => setView(ViewMode.DASHBOARD)}
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
            {view === ViewMode.RECORDS && (
              <RecordsList
                records={records.slice(0, 5)}
                loading={loading}
                onRefresh={() => loadData()}
                onBack={() => setView(ViewMode.DASHBOARD)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
