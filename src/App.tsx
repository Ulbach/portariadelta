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

  /**
   * ===============================
   * CARREGAR DADOS DA PLANILHA
   * ===============================
   */

  const loadData = useCallback(async (silent = false) => {

    if (!silent) setLoading(true);

    try {

      const dynamicCompanies = await sheetService.fetchCompanies();

      const currentCompanies =
        dynamicCompanies.length > 0 ? dynamicCompanies : INITIAL_COMPANIES;

      setCompanies(currentCompanies);

      /**
       * CARREGAR PARCEIROS
       */

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

      /**
       * CARREGAR REGISTROS
       */

      const recordsCsv = await sheetService.fetchSheetCSV(DATA_TAB_NAME);

      const parsedRecords = sheetService.parseAttendanceRecords(recordsCsv);

      setRecords(parsedRecords);

      setError(null);

    } catch (err) {

      console.error('Erro na sincronização:', err);

      if (!silent) {

        setError(
          'Erro ao sincronizar dados. Verifique se a planilha está compartilhada corretamente.'
        );

      }

    } finally {

      if (!silent) setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadData();

  }, []);

  /**
   * =====================================
   * CALCULO DE QUEM ESTÁ DENTRO
   * =====================================
   */

  const activeNow = useMemo(() => {

    const map: Record<string, AttendanceRecord> = {};

    records
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .forEach((r) => {

        const key = r.partnerName.toLowerCase().trim();

        if (r.type === 'ENTRY') map[key] = r;

        if (r.type === 'EXIT') delete map[key];

      });

    return Object.values(map);

  }, [records]);

  /**
   * =====================================
   * REGISTRAR ENTRADA / SAIDA
   * =====================================
   */

  const handleRegisterAction = async (
    partnerName: string,
    type: 'ENTRY' | 'EXIT'
  ) => {

    const name = partnerName.trim();

    const isInside = sheetService.isPartnerInside(records, name);

    /**
     * VALIDAÇÕES
     */

    if (type === 'ENTRY' && isInside) {

      setNotifying('Parceiro já está dentro.');

      setTimeout(() => setNotifying(null), 2500);

      return false;

    }

    if (type === 'EXIT' && !isInside) {

      setNotifying('Parceiro não está na empresa.');

      setTimeout(() => setNotifying(null), 2500);

      return false;

    }

    setNotifying('Enviando...');

    const p = partners.find(
      (part) => part.name.trim().toLowerCase() === name.toLowerCase()
    );

    const company = p?.company || 'Parceiro';

    /**
     * REGISTRO TEMPORARIO (UX)
     */

    const tempRecord: AttendanceRecord = {

      id: 'temp-' + Date.now(),

      partnerId: '',

      partnerName: name,

      company,

      type,

      timestamp: new Date()

    };

    const success = await sheetService.appendRecord(
      { name, company },
      type
    );

    if (success) {

      setRecords((prev) => [tempRecord, ...prev]);

      setNotifying('Registrado!');

      setTimeout(() => {

        setNotifying(null);

        loadData(true);

      }, 3000);

      return true;

    } else {

      setNotifying('Erro ao registrar.');

      setTimeout(() => setNotifying(null), 3000);

      return false;

    }

  };

  /**
   * =====================================
   * FLAGS
   * =====================================
   */

  const isDashboard = view === ViewMode.DASHBOARD;

  const isWelcome = view === ViewMode.WELCOME;

  /**
   * =====================================
   * UI
   * =====================================
   */

  return (

    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50/50 shadow-2xl relative overflow-hidden">

      {!isWelcome && (

        <header
          className={`relative bg-[#5b806d] text-white px-6 transition-all duration-300 ${
            isDashboard ? 'pt-12 pb-24 rounded-b-[42px]' : 'py-5 shadow-lg'
          }`}
        >

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">

              {!isDashboard && (

                <button
                  onClick={() => setView(ViewMode.DASHBOARD)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
                >

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 19l-7-7 7-7"
                    />

                  </svg>

                </button>

              )}

              <div>

                <h1 className="text-xl font-black">Portaria Inteligente</h1>

                <p className="text-[9px] uppercase tracking-widest">
                  Controle de Parceiro
                </p>

              </div>

            </div>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
            >

              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"
                />

              </svg>

            </button>

          </div>

          {isDashboard && (

            <div className="absolute -bottom-8 left-6 right-6">

              <div className="bg-white p-5 rounded-[32px] shadow-xl flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 bg-[#5b806d]/10 text-[#5b806d] rounded-2xl flex items-center justify-center">

                    <ICONS.Users className="w-6 h-6" />

                  </div>

                  <div>

                    <span className="text-3xl font-black text-slate-800">

                      {loading ? '...' : activeNow.length}

                    </span>

                    <p className="text-[9px] uppercase tracking-widest">

                      Presentes Agora

                    </p>

                  </div>

                </div>

                <button
                  onClick={() => {
                    setRegistrationInitialTab('ACTIVE');
                    setView(ViewMode.REGISTRATION);
                  }}
                  className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold"
                >

                  Ver Lista

                </button>

              </div>

            </div>

          )}

        </header>

      )}

      {notifying && (

        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">

          <div className="px-6 py-3 rounded-full bg-slate-800 text-white text-xs font-bold">

            {notifying}

          </div>

        </div>

      )}

      <main className="flex-1 overflow-y-auto p-4">

        {error ? (

          <div className="p-10 text-center">

            <p>{error}</p>

          </div>

        ) : (

          <>
            {view === ViewMode.WELCOME && (
              <Welcome onStart={() => setView(ViewMode.DASHBOARD)} />
            )}

            {view === ViewMode.DASHBOARD && (
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
            )}

            {view === ViewMode.PARTNERS && (
              <PartnersList
                partners={partners}
                companies={companies}
                loading={loading}
                onBack={() => setView(ViewMode.DASHBOARD)}
                onQuickRegister={handleRegisterAction}
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
                records={records}
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
