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
      <header className="relative bg-[#698c78] text-white px-6 pt-14 pb-32 rounded-b-[40px] overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[19px] font-black leading-tight tracking-tight">
              Portaria Inteligente
            </h1>
            <p className="text-[9px] text-emerald-100/70 uppercase font-black tracking-[0.25em] mt-1">
              Controle de Parceiro
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-all hover:bg-white/15"
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

        {/* CARD CONTAGEM */}
        <div className="absolute -bottom-5 left-6 right-6">
          <div className="bg-white p-5 rounded-[30px] shadow-xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-4 text-left">
              <div className="relative w-12 h-12 rounded-2xl bg-[#5b806d]/10 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-2xl ring-1 ring-[#5b806d]/10"></div>
                <ICONS.Users className="w-6 h-6 text-[#5b806d]" />
              </div>

              <div className="flex flex-col">
                <span className="text-[28px] font-black text-slate-800 leading-none">
                  {loading ? '...' : activeCount}
                </span>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  Presentes Agora
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateAction('ACTIVE')}
              className="bg-slate-50 text-slate-500 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all border border-slate-200/50 hover:bg-slate-100"
            >
              Ver Lista
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pt-10 pb-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateAction('NEW')}
            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all duration-200 active:scale-95 hover:shadow-md hover:border-[#5b806d]/25 hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#5b806d]/20"
          >
            <div className="w-10 h-10 bg-slate-50 text-[#5b806d] rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#5b806d] group-hover:text-white group-focus:bg-[#5b806d] group-focus:text-white">
              <ICONS.LogIn className="w-5 h-5" />
            </div>

            <span className="text-xs font-bold text-slate-700 leading-tight text-left transition-colors duration-200 group-hover:text-slate-900">
              Registrar
              <br />
              Entrada
            </span>
          </button>

          <button
            onClick={() => onNavigateAction('ACTIVE')}
            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all duration-200 active:scale-95 hover:shadow-md hover:border-rose-200 hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-rose-200/60"
          >
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-rose-600 group-hover:text-white group-focus:bg-rose-600 group-focus:text-white">
              <ICONS.LogOut className="w-5 h-5" />
            </div>

            <span className="text-xs font-bold text-slate-700 leading-tight text-left transition-colors duration-200 group-hover:text-slate-900">
              Registrar
              <br />
              Saída
            </span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900 text-[18px]">
              Atividade Recente
            </h3>

            <span className="text-[10px] font-bold text-[#5b806d] uppercase tracking-widest">
              {isFallback ? 'Últimos 6' : 'Hoje'}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#5b806d] border-t-transparent rounded-full animate-spin"></div>
                Sincronizando...
              </div>
            ) : displayRecords.length > 0 ? (
              displayRecords.map((record, index) => (
                <div
                  key={`${record.id}-${index}`}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      record.type === 'ENTRY'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {record.type === 'ENTRY' ? (
                      <ICONS.LogIn className="w-5 h-5" />
                    ) : (
                      <ICONS.LogOut className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-[14px]">
                      {record.partnerName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate uppercase">
                      {record.company}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">
                      {record.timestamp.toLocaleDateString([], {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                    <p className="text-xs font-bold text-slate-600">
                      {record.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p
                      className={`text-[9px] font-bold uppercase tracking-wider ${
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
                  className="w-12 h-12 mx-auto mb-3 opacity-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
