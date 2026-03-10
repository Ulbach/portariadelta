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
      {/* HEADER VISUAL NOVO + LÓGICA ANTIGA */}
      <header className="relative overflow-hidden rounded-b-[42px] bg-[#6f8f7c] pb-28 pt-8 shadow-lg">
        {/* FUNDO */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7fa08d]/85 to-[#5d7d6c]/90" />

        <div className="relative z-10 px-6">
          <button
            onClick={onRefresh}
            className="absolute right-6 top-0 w-11 h-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-all hover:bg-white/20"
            aria-label="Atualizar"
          >
            <svg
              className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`}
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

          <div className="flex items-start gap-4 pr-16">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-md shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="3" y="14" width="7" height="5" rx="1.5" />
                <rect x="14" y="11" width="7" height="8" rx="1.5" />
              </svg>
            </div>

            <div className="min-w-0">
              <h1 className="text-white text-[18px] font-black leading-tight tracking-tight">
                Portaria
                <br />
                Inteligente
              </h1>

              <p className="mt-1 text-[10px] text-emerald-100/80 font-black uppercase tracking-[0.25em]">
                Controle de Parceiro
              </p>
            </div>
          </div>
        </div>

        {/* CARD CONTAGEM */}
        <div className="absolute -bottom-6 left-6 right-6 z-20">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#5b806d] text-white flex items-center justify-center shadow-md shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
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

              <div>
                <p className="text-[30px] font-black text-slate-800 leading-none">
                  {loading ? '...' : activeCount}
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  Presentes Agora
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateAction('ACTIVE')}
              className="bg-[#5b806d] text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-[#4f705f] transition-all active:scale-95"
            >
              Ver Lista
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pt-16 pb-8 space-y-6">
        {/* BOTÕES */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateAction('NEW')}
            className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-[0_8px_30px_rgba(91,128,109,0.10)] hover:border-[#5b806d]/20"
          >
            <div className="w-12 h-12 bg-emerald-50 text-[#5b806d] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#5b806d] group-hover:text-white transition-all duration-300 shadow-sm">
              <ICONS.LogIn className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-tight text-center">
              Registrar
              <br />
              Entrada
            </span>
          </button>

          <button
            onClick={() => onNavigateAction('ACTIVE')}
            className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-[0_8px_30px_rgba(225,29,72,0.10)] hover:border-rose-100"
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <ICONS.LogOut className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-tight text-center">
              Registrar
              <br />
              Saída
            </span>
          </button>
        </div>

        {/* ATIVIDADE RECENTE */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5b806d]"></div>
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">
                Atividade Recente
              </h3>
            </div>

            <span className="text-[9px] font-black text-[#5b806d] bg-[#5b806d]/10 px-2 py-1 rounded-lg uppercase tracking-widest">
              {isFallback ? 'Últimos 6' : 'Hoje'}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#5b806d] border-t-transparent rounded-full animate-spin"></div>
                <span className="font-black text-[10px] uppercase tracking-widest">
                  Sincronizando...
                </span>
              </div>
            ) : displayRecords.length > 0 ? (
              displayRecords.map((record, index) => (
                <div
                  key={`${record.id}-${index}`}
                  className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${
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
                    <p className="font-black text-slate-800 truncate text-sm uppercase tracking-tight">
                      {record.partnerName}
                    </p>
                    <p className="text-[9px] text-slate-400 font-black truncate uppercase tracking-widest mt-0.5">
                      {record.company}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900 leading-tight">
                      {record.timestamp.toLocaleDateString([], {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                    <p className="text-xs font-black text-slate-600 mt-0.5">
                      {record.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p
                      className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${
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
              <div className="p-20 text-center text-slate-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-10"
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
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Nenhum registro hoje
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
