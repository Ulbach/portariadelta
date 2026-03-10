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

      {/* HEADER CENTRALIZADO */}
      <header className="relative bg-[#6f8f7c] text-white pt-14 pb-32 rounded-b-[40px]">

        {/* BOTÃO REFRESH */}
        <button
          onClick={onRefresh}
          className="absolute right-6 top-6 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M19.418 15H15"
            />
          </svg>
        </button>

        {/* TÍTULO CENTRAL */}
        <div className="text-center space-y-2">

          <h1 className="text-[22px] font-black tracking-tight">
            Portaria Inteligente
          </h1>

          <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-100/80 font-bold">
            Controle de Parceiro
          </p>

          {/* EMPRESA */}
          <div className="pt-2">
            <span className="text-[14px] font-black tracking-[0.25em] text-white/90">
              # DELTA GERAÇÃO #
            </span>
          </div>

        </div>

        {/* CARD CONTAGEM */}
        <div className="absolute -bottom-3 left-6 right-6">

          <div className="bg-white p-5 rounded-[30px] shadow-xl flex items-center justify-between border border-slate-100">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 bg-[#5b806d]/10 rounded-2xl flex items-center justify-center shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#5b806d]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="9" cy="7" r="3" />
                  <path d="M4 19c0-3 3-5 5-5" />
                  <path d="M16 11l2 2 4-4" />
                </svg>
              </div>

              <div className="flex flex-col">

                <span className="text-[30px] font-black text-slate-800 leading-none">
                  {loading ? '...' : activeCount}
                </span>

                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  Presentes Agora
                </p>

              </div>

            </div>

            <button
              onClick={() => onNavigateAction('ACTIVE')}
              className="bg-slate-50 text-slate-500 px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider border border-slate-200 hover:bg-slate-100 transition"
            >
              Ver Lista
            </button>

          </div>
        </div>

      </header>

      {/* CONTEÚDO */}
      <div className="px-6 pt-10 pb-8 space-y-6">

        {/* BOTÕES */}
        <div className="grid grid-cols-2 gap-4">

          <button
            onClick={() => onNavigateAction('NEW')}
            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-[#5b806d]/30 transition"
          >

            <div className="w-10 h-10 bg-slate-50 text-[#5b806d] rounded-xl flex items-center justify-center group-hover:bg-[#5b806d] group-hover:text-white transition">
              <ICONS.LogIn className="w-5 h-5" />
            </div>

            <span className="text-xs font-bold text-slate-700">
              Registrar
              <br />
              Entrada
            </span>

          </button>

          <button
            onClick={() => onNavigateAction('ACTIVE')}
            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-rose-300 transition"
          >

            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <ICONS.LogOut className="w-5 h-5" />
            </div>

            <span className="text-xs font-bold text-slate-700">
              Registrar
              <br />
              Saída
            </span>

          </button>

        </div>

        {/* ATIVIDADE */}
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

            {displayRecords.map((record, index) => (

              <div
                key={`${record.id}-${index}`}
                className="p-4 flex items-center gap-4"
              >

                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    record.type === 'ENTRY'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {record.type === 'ENTRY'
                    ? <ICONS.LogIn className="w-5 h-5" />
                    : <ICONS.LogOut className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">

                  <p className="font-black text-slate-900 truncate text-[14px]">
                    {record.partnerName}
                  </p>

                  <p className="text-[10px] text-slate-400 uppercase">
                    {record.company}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-[10px] font-bold text-slate-900">
                    {record.timestamp.toLocaleDateString()}
                  </p>

                  <p className="text-xs font-bold text-slate-600">
                    {record.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  <p
                    className={`text-[9px] font-bold uppercase ${
                      record.type === 'ENTRY'
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {record.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
