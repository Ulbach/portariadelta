
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

const Dashboard: React.FC<DashboardProps> = ({ records, loading, onNavigateAction }) => {
  const sortedRecords = [...records].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  const today = new Date();
  const todayRecords = sortedRecords.filter(r => {
    return r.timestamp.getDate() === today.getDate() && 
           r.timestamp.getMonth() === today.getMonth() &&
           r.timestamp.getFullYear() === today.getFullYear();
  });

  const displayRecords = todayRecords.length > 0 ? todayRecords.slice(0, 6) : sortedRecords.slice(0, 6);
  const isFallback = todayRecords.length === 0 && sortedRecords.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Botões Rápidos de Ação */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigateAction('NEW')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-[0_8px_30px_rgb(91,128,109,0.1)] hover:border-[#5b806d]/20 group"
        >
          <div className="w-12 h-12 bg-emerald-50 text-[#5b806d] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#5b806d] group-hover:text-white transition-all duration-300 shadow-sm">
            <ICONS.LogIn className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-tight">Registrar<br/>Entrada</span>
        </button>

        <button 
          onClick={() => onNavigateAction('ACTIVE')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-[0_8px_30px_rgb(225,29,72,0.1)] hover:border-rose-100 group"
        >
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <ICONS.LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-tight">Registrar<br/>Saída</span>
        </button>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5b806d]"></div>
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Atividade Recente</h3>
          </div>
          <span className="text-[9px] font-black text-[#5b806d] bg-[#5b806d]/10 px-2 py-1 rounded-lg uppercase tracking-widest">
            {isFallback ? 'Últimos 6' : 'Hoje'}
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
             <div className="p-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-[#5b806d] border-t-transparent rounded-full animate-spin"></div>
               <span className="font-black text-[10px] uppercase tracking-widest">Sincronizando...</span>
             </div>
          ) : displayRecords.length > 0 ? displayRecords.map(record => (
            <div key={record.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${record.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {record.type === 'ENTRY' ? <ICONS.LogIn className="w-6 h-6" /> : <ICONS.LogOut className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate text-sm uppercase tracking-tight">{record.partnerName}</p>
                <p className="text-[9px] text-slate-400 font-black truncate uppercase tracking-widest mt-0.5">{record.company}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-900 leading-tight">
                  {record.timestamp.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                </p>
                <p className="text-xs font-black text-slate-600 mt-0.5">
                  {record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${record.type === 'ENTRY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {record.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                </p>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro hoje</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
