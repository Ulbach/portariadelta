import React, { useState, useMemo, useEffect } from 'react';
import { Partner, StayReport } from '../types';
import { ICONS } from '../constants';

const Registration: React.FC<any> = ({ partners, activeReports, onQuickRegister, initialTab = 'ACTIVE', onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState(initialTab);

  useEffect(() => { setViewType(initialTab); }, [initialTab]);

  const filteredSearch = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const namesInside = activeReports.map((r: any) => r.partnerName.trim().toLowerCase());

    return partners.filter((p: any) => {
      const isMatch = p.name.toLowerCase().includes(term);
      const isAlreadyInside = namesInside.includes(p.name.trim().toLowerCase());
      // FILTRO DE STATUS ATIVO (Vindo da Coluna B da aba da empresa)
      const isActive = p.status?.toString().trim().toLowerCase() === 'ativo';
      
      return isMatch && !isAlreadyInside && isActive;
    }).slice(0, 15);
  }, [partners, searchTerm, activeReports]);

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        <button onClick={() => setViewType('NEW')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase ${viewType === 'NEW' ? 'bg-[#5b806d] text-white' : 'text-slate-400'}`}>Novos</button>
        <button onClick={() => setViewType('ACTIVE')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase ${viewType === 'ACTIVE' ? 'bg-[#5b806d] text-white' : 'text-slate-400'}`}>Ativos</button>
      </div>

      {viewType === 'NEW' ? (
        <div className="space-y-4">
          <input type="text" placeholder="Buscar colaborador ativo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm" />
          <div className="grid gap-2">
            {filteredSearch.map((p: any) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{p.company}</p>
                </div>
                <button onClick={() => onQuickRegister(p.name, 'ENTRY')} className="bg-[#5b806d] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Entrada</button>
              </div>
            ))}
            {filteredSearch.length === 0 && <p className="text-center text-slate-400 text-xs py-10">Nenhum colaborador ativo encontrado.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeReports.map((r: any) => (
             <div key={r.recordId} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
               <div>
                 <p className="font-bold text-slate-800">{r.partnerName}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">{r.company}</p>
               </div>
               <button onClick={() => onQuickRegister(r.partnerName, 'EXIT')} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Sair</button>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Registration;
