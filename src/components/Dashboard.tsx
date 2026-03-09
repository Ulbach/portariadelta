import React from 'react';
import { AttendanceRecord } from '../types';
import { ICONS } from '../constants';

interface DashboardProps {
  activeCount: number;
  records: AttendanceRecord[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateAction: (tab: 'NEW' | 'ACTIVE') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  activeCount,
  records = [],
  loading,
  onRefresh,
  onNavigateAction
}) => {
  const safeRecords = (records || [])
    .map((record) => ({
      ...record,
      timestamp:
        record.timestamp instanceof Date
          ? record.timestamp
          : new Date(record.timestamp)
    }))
    .filter((record) => !isNaN(record.timestamp.getTime()));

  const sortedRecords = [...safeRecords].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const today = new Date();

  const todayRecords = sortedRecords.filter((r) => {
    return (
      r.timestamp.getDate() === today.getDate() &&
      r.timestamp.getMonth() === today.getMonth() &&
      r.timestamp.getFullYear() === today.getFullYear()
    );
  });

  const displayRecords =
    todayRecords.length > 0
      ? todayRecords.slice(0, 6)
      : sortedRecords.slice(0, 6);

  const isFallback =
    todayRecords.length === 0 && sortedRecords.length > 0;

  return (
    <div className="min-h-screen bg-slate-100/80">
      <header className="relative bg-[#698c78] text-white px-6 pt-16 pb-28 rounded-b-[44px] overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              Portaria Inteligente
            </h1>
            <p className="text-[10px] text-emerald-100/70 uppercase font-black tracking-[0.25em] mt-1">
              Controle de Parceiro
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-all"
            aria-label="Atualizar"
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
                strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="absolute -bottom-10 left-6 right-6">
          <div className="bg-white p-6 rounded-[36px] shadow-xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-5 text-left">
              <div className="w-14 h-14 bg-[#5b806d]/10 text-[#5b806d] rounded-2xl flex items-center justify-center">
                <ICONS.Users className="w-7 h-7" />
              </div>

              <div className="flex flex-col">
                <span className="text-5xl font-black text-slate-900 leading-none">
                  {loading ? '...' : activeCount}
                </span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                  Presentes Agora
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateAction('ACTIVE')}
              className="bg-slate-50 text-slate-500 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all border border-slate-200/70"
            >
              Ver Lista
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pt-16 pb-8 space-y-8">
        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={() => onNavigateAction('NEW')}
            className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-14 h-14 bg-slate-50 text-[#5b806d] rounded-2xl flex items-center justify-center shrink-0">
              <ICONS.LogIn className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-slate-800 leading-tight text-left">
              Registrar
              <br />
              Entrada
            </span>
          </button>

          <button
            onClick={() => onNavigateAction('ACTIVE')}
            className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
              <ICONS.LogOut className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-slate-800 leading-tight text-left">
              Registrar
              <br />
              Saída
            </span>
          </button>
        </div>

        <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-black text-slate-900">
              Atividade Recente
            </h3>

            <span className="text-[11px] font-black text-[#5b806d] uppercase tracking-[0.2em]">
              {isFallback ? 'Últimos 6' : 'Hoje'}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-base flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#5b806d] border-t-transparent rounded-full animate-spin"></div>
                Sincronizando...
              </div>
            ) : displayRecords.length > 0 ? (
              displayRecords.map((record, index) => (
                <div
                  key={`${record.id}-${index}`}
                  className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      record.type === 'ENTRY'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {record.type === 'ENTRY' ? (
                      <ICONS.LogIn className="w-6 h-6" />
                    ) : (
                      <ICONS.LogOut className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-xl leading-tight">
                      {record.partnerName}
                    </p>
                    <p className="text-[12px] text-slate-400 font-medium truncate uppercase mt-1">
                      {record.company}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[12px] font-black text-slate-900 leading-tight">
                      {record.timestamp.toLocaleDateString([], {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                    <p className="text-lg font-black text-slate-700 leading-tight">
                      {record.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p
                      className={`text-[12px] font-black uppercase tracking-wider ${
                        record.type === 'ENTRY'
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {record.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400">
                <svg
                  className="w-14 h-14 mx-auto mb-4 opacity-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-base">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
