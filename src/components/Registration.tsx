import React, { useState, useMemo, useEffect } from 'react';
import { Partner, StayReport } from '../types';
import { ICONS } from '../constants';

interface RegistrationProps {
  partners: Partner[];
  activeReports: StayReport[];
  onRegistered: () => void;
  onQuickRegister: (name: string, type: 'ENTRY' | 'EXIT') => Promise<boolean>;
  initialTab?: 'NEW' | 'ACTIVE';
  onBack?: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ partners, activeReports, onQuickRegister, initialTab = 'ACTIVE', onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [viewType, setViewType] = useState<'NEW' | 'ACTIVE'>(initialTab);
  const [recentlyExited, setRecentlyExited] = useState<string[]>([]);

  useEffect(() => { setViewType(initialTab); }, [initialTab]);

  const filteredSearch = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const namesInside = activeReports.map(r => r.partnerName.trim().toLowerCase());

    return partners.filter(p => {
      // CORREÇÃO: Removida a trava de term.length < 2. Se vazio, mostra todos.
      const isMatch = term === '' || p.name.toLowerCase().includes(term);
      const isAlreadyInside = namesInside.includes(p.name.trim().toLowerCase());
      const isActive = !p.status || p.status.toLowerCase() === 'ativo';
      return isMatch && !isAlreadyInside && isActive;
    }).slice(0, 15);
  }, [partners, searchTerm, activeReports]);

  const handleRegister = async (name: string, type: 'ENTRY' | 'EXIT') => {
    const success = await onQuickRegister(name, type);
    if (success && type === 'EXIT') {
      setRecentlyExited(prev => [...prev, name.toLowerCase()]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 shadow-sm">
        <button onClick={() => setViewType('NEW')} className={`flex-1 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all ${viewType === 'NEW' ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400'}`}>Novos</button>
        <button onClick={() => setViewType('ACTIVE')} className={`flex-1 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all ${viewType === 'ACTIVE' ? 'bg-[#5b806d] text-white shadow-lg' : 'text-slate-400'}`}>Ativos</button>
      </div>

      {viewType === 'NEW' ? (
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">{ICONS.SEARCH}</div>
            <input type="text" placeholder="Buscar parceiro ou empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-100 py-5 pl-14 pr-6 rounded-[24px] text-sm focus:outline-none focus:ring-4 focus:ring-[#5b806d]/10 transition-all placeholder:text-slate-300 font-medium" />
          </div>

          <div className="grid gap-3">
            {filteredSearch.map((partner) => (
              <div key={partner.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-[#5b806d]/30 transition-all">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{partner.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{partner.company}</p>
                </div>
                <button onClick={() => handleRegister(partner.name, 'ENTRY')} className="bg-[#5b806d]/10 text-[#5b806d] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-[#5b806d] hover:text-white transition-all active:scale-95">Entrada</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeReports.filter(r => !recentlyExited.includes(r.partnerName.toLowerCase())).length > 0 ? (
            activeReports.filter(r => !recentlyExited.includes(r.partnerName.toLowerCase())).map((report) => (
              <div key={report.recordId} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">{ICONS.LogOut}</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-tight">{report.partnerName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{report.company}</p>
                  </div>
                </div>
                <button onClick={() => handleRegister(report.partnerName, 'EXIT')} className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors active:scale-90">SAÍDA</button>
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto opacity-20"><ICONS.Users className="w-8 h-8" /></div>
              <p className="text-slate-400 text-sm font-medium">Ninguém na planta no momento.</p>
            </div>
          )}
        </div>
      )}

      {onBack && (
        <div className="px-2 pt-6">
          <button onClick={onBack} className="w-full py-5 bg-[#5b806d] text-white shadow-lg shadow-[#5b806d]/20 font-black text-[10px] uppercase tracking-[0.3em] rounded-3xl active:scale-95 transition-all flex items-center justify-center gap-3">
            VOLTAR AO PAINEL
          </button>
        </div>
      )}
    </div>
  );
};

export default Registration;
