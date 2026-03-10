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
      const parsedRecords = sheetService.parseAttendanceRecords(recordsCsv);

      setRecords(parsedRecords);
      setError(null);
    } catch (err) {
      console.error('Erro sincronizando:', err);

      if (!silent) {
        setError('Erro ao sincronizar dados.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stayReports = useMemo(
    () => sheetService.calculateStayReports(records),
    [records]
  );

  const activeNow = useMemo(
    () => stayReports.filter((r) => !r.exitTime),
    [stayReports]
  );

  const handleRegisterAction = async (
    partnerName: string,
    type: 'ENTRY' | 'EXIT'
  ) => {
    const normalizedName = partnerName.trim();
    const isInside = sheetService.isPartnerInside(records, normalizedName);

    if (type === 'ENTRY' && isInside) {
      setNotifying('Parceiro já está na planta.');
      setTimeout(() => setNotifying(null), 2000);
      return false;
    }

    if (type === 'EXIT' && !isInside) {
      setNotifying('Parceiro não está na planta.');
      setTimeout(() => setNotifying(null), 2000);
      return false;
    }

    setNotifying('Enviando...');

    const p = partners.find(
      (part) =>
        part.name.trim().toLowerCase() === normalizedName.toLowerCase()
    );

    const company = p?.company || 'Parceiro';

    const tempRecord: AttendanceRecord = {
      id: 'temp-' + Date.now(),
      partnerId: '',
      partnerName: normalizedName,
      company,
      type,
      timestamp: new Date()
    };

    const success = await sheetService.appendRecord(
      { name: normalizedName, company },
      type
    );

    if (success) {
      setRecords((prev) => [tempRecord, ...prev]);

      setNotifying('Registrado!');

      setTimeout(() => {
        setNotifying(null);
        loadData(true);
      }, 2000);

      return true;
    } else {
      setNotifying('Falha no envio');
      setTimeout(() => setNotifying(null), 2000);
      return false;
    }
  };

  const renderView = () => {
    switch (view) {
      case ViewMode.WELCOME:
        return <Welcome onStart={() => setView(ViewMode.DASHBOARD)} />;

      case ViewMode.DASHBOARD:
        return (
          <Dashboard
            activeCount={activeNow.length}
            records={records}
            loading={loading}
            onRefresh={() => loadData()}
            onNavigateAction={(tab) => {
              setRegistrationInitialTab(tab);
              setView(ViewMode.REGISTRATION);
            }}
          />
        );

      case ViewMode.PARTNERS:
        return (
          <PartnersList
            partners={partners}
            companies={companies}
            activeReports={stayReports}
            loading={loading}
            onQuickRegister={handleRegisterAction}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        );

      case ViewMode.REPORTS:
        return (
          <Reports
            records={records}
            loading={loading}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        );

      case ViewMode.REGISTRATION:
        return (
          <Registration
            partners={partners}
            activeReports={activeNow}
            onRegistered={() => loadData(true)}
            onQuickRegister={handleRegisterAction}
            initialTab={registrationInitialTab}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        );

      case ViewMode.RECORDS:
        return (
          <RecordsList
            records={records}
            loading={loading}
            onRefresh={() => loadData()}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        );

      default:
        return null;
    }
  };

  const showBottomMenu = view === ViewMode.DASHBOARD;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 shadow-2xl relative overflow-hidden">
      {notifying && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="px-6 py-3 rounded-full bg-slate-800 text-white shadow-2xl font-black text-[10px] uppercase tracking-widest">
            {notifying}
          </div>
        </div>
      )}

      <main
        className={
          view === ViewMode.WELCOME
            ? 'flex-1 overflow-y-auto'
            : `flex-1 overflow-y-auto ${showBottomMenu ? 'pb-24' : 'pb-6'}`
        }
      >
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          renderView()
        )}
      </main>

      {showBottomMenu && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-3 z-20 shadow-2xl rounded-t-[32px]">
          <button
            onClick={() => setView(ViewMode.WELCOME)}
            className="flex flex-col items-center gap-1 text-[#5b806d]"
          >
            <ICONS.Dashboard className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              Início
            </span>
          </button>

          <button
            onClick={() => setView(ViewMode.PARTNERS)}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <ICONS.Users className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              Empresas
            </span>
          </button>

          <button
            onClick={() => setView(ViewMode.REPORTS)}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <ICONS.FileText className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              Relatórios
            </span>
          </button>

          <button
            onClick={() => setView(ViewMode.RECORDS)}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <ICONS.History className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              Registros
            </span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
