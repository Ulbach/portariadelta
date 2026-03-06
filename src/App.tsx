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
        const csv = await sheetService.fetchSheetCSV(company);
        return sheetService.parsePartners(csv, company);
      });

      const partnersResults = await Promise.all(partnersPromises);

      setPartners(partnersResults.flat());

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);

      const parsedRecords = sheetService.parseAttendanceRecords(recordsCsv);

      setRecords(parsedRecords);

      setError(null);

    } catch (err) {

      console.error("Erro sincronizando:", err);

      if (!silent) {
        setError("Erro ao sincronizar dados.");
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
    () => stayReports.filter(r => !r.exitTime),
    [stayReports]
  );

  const handleRegisterAction = async (
    partnerName: string,
    type: 'ENTRY' | 'EXIT'
  ) => {

    setNotifying("Enviando...");

    const p = partners.find(
      part =>
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

      setRecords(prev => [tempRecord, ...prev]);

      setNotifying("Registrado!");

      setTimeout(() => {

        setNotifying(null);

        loadData(true);

      }, 3000);

      return true;

    } else {

      setNotifying("Falha no envio");

      setTimeout(() => setNotifying(null), 3000);

      return false;

    }

  };

  const renderView = () => {

    switch (view) {

      case ViewMode.WELCOME:
        return <Welcome onStart={() => setView(ViewMode.DASHBOARD)} />

      case ViewMode.DASHBOARD:
        return (
          <Dashboard
            activeCount={activeNow.length}
            records={records}
            loading={loading}
            onRefresh={() => loadData()}
            onNavigateAction={(t) => {
              setRegistrationInitialTab(t);
              setView(ViewMode.REGISTRATION);
            }}
          />
        )

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
        )

      case ViewMode.REPORTS:
        return (
          <Reports
            records={records}
            loading={loading}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        )

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
        )

      case ViewMode.RECORDS:
        return (
          <RecordsList
            records={records}
            loading={loading}
            onRefresh={() => loadData()}
            onBack={() => setView(ViewMode.DASHBOARD)}
          />
        )

      default:
        return null

    }

  };

  return (

    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 shadow-2xl">

      <main className="flex-1 overflow-y-auto p-4 pb-24">

        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          renderView()
        )}

      </main>

      {/* MENU FIXO */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t flex justify-around items-center p-3 shadow-xl">

        <button
          onClick={() => setView(ViewMode.DASHBOARD)}
          className="flex flex-col items-center text-[#5b806d]"
        >
          <ICONS.Dashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">INÍCIO</span>
        </button>

        <button
          onClick={() => setView(ViewMode.PARTNERS)}
          className="flex flex-col items-center text-slate-400"
        >
          <ICONS.Users className="w-5 h-5" />
          <span className="text-[9px] font-bold">EMPRESAS</span>
        </button>

        <button
          onClick={() => setView(ViewMode.REPORTS)}
          className="flex flex-col items-center text-slate-400"
        >
          <ICONS.FileText className="w-5 h-5" />
          <span className="text-[9px] font-bold">RELATÓRIOS</span>
        </button>

        <button
          onClick={() => setView(ViewMode.RECORDS)}
          className="flex flex-col items-center text-slate-400"
        >
          <ICONS.History className="w-5 h-5" />
          <span className="text-[9px] font-bold">REGISTROS</span>
        </button>

      </nav>

    </div>

  );

};

export default App;
