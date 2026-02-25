
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
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-95 transition-all hover:border-[#5b806d]/30 group"
        >
          <div className="w-10 h-10 bg-slate-50 text-[#5b806d] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#5b806d] group-hover:text-white transition-colors">
            <ICONS.LogIn className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight text-left">Registrar<br/>Entrada</span>
        </button>

        <button 
          onClick={() => onNavigateAction('ACTIVE')}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-95 transition-all hover:border-rose-200 group"
        >
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <ICONS.LogOut className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight text-left">Registrar<br/>Saída</span>
        </button>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-bold text-slate-800">Atividade Recente</h3>
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
          ) : displayRecords.length > 0 ? displayRecords.map(record => (
            <div key={record.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${record.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {record.type === 'ENTRY' ? <ICONS.LogIn className="w-5 h-5" /> : <ICONS.LogOut className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate text-sm">{record.partnerName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate uppercase">{record.company}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-900 leading-tight">
                  {record.timestamp.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${record.type === 'ENTRY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {record.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                </p>
              </div>
            </div>
          )) : (
            <div className="p-16 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
