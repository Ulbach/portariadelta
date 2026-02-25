
import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { ICONS, DATA_TAB_NAME } from '../constants';
import * as sheetService from '../services/sheetService';

interface RecordsListProps {
  records: AttendanceRecord[];
  loading: boolean;
  onRefresh?: () => void;
  onBack?: () => void;
}

const RecordsList: React.FC<RecordsListProps> = ({ records, loading, onRefresh, onBack }) => {
  const [isClearing, setIsClearing] = useState(false);

  const last100 = [...records]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 100);

  const handleClear = async () => {
    if (window.confirm("Tem certeza que deseja apagar TODO o histórico de registros na planilha? Esta ação não pode ser desfeita.")) {
      setIsClearing(true);
      const success = await sheetService.clearAllRecords();
      if (success) {
        alert("Comando de limpeza enviado! Os dados sumirão em instantes.");
        if (onRefresh) onRefresh();
      } else {
        alert("Falha ao enviar comando de limpeza.");
      }
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Últimos 100 Registros</h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Histórico na aba Dados</span>
          </div>
          
          <button 
            onClick={handleClear}
            disabled={isClearing || loading || records.length === 0}
            className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl uppercase tracking-wider hover:bg-rose-100 transition-colors disabled:opacity-30"
          >
            {isClearing ? 'Limpando...' : 'Limpar Tudo'}
          </button>
        </div>
        
        <div className="divide-y divide-slate-50">
          {loading ? (
             <div className="p-20 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
               <div className="w-6 h-6 border-2 border-[#5b806d] border-t-transparent rounded-full animate-spin"></div>
               Sincronizando...
             </div>
          ) : last100.length > 0 ? last100.map(record => (
            <div key={record.id} className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${record.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {record.type === 'ENTRY' ? <ICONS.LogIn className="w-5 h-5" /> : <ICONS.LogOut className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate text-sm uppercase tracking-tight">{record.partnerName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{record.company}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-slate-900 leading-tight">
                  {record.timestamp.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-[9px] font-black uppercase tracking-wider ${record.type === 'ENTRY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {record.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                </p>
              </div>
            </div>
          )) : (
            <div className="p-16 text-center text-slate-400 text-sm italic">
              Nenhum registro encontrado na aba {DATA_TAB_NAME}.
            </div>
          )}
        </div>
      </div>

      {onBack && (
        <div className="px-2 pt-6">
          <button 
            onClick={onBack}
            className="w-full py-5 bg-[#5b806d] text-white shadow-lg shadow-[#5b806d]/20 font-black text-[10px] uppercase tracking-[0.3em] rounded-3xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
            Voltar ao Início
          </button>
        </div>
      )}
    </div>
  );
};

export default RecordsList;
