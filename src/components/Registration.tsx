
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

const Registration: React.FC<RegistrationProps> = ({ partners, activeReports, onRegistered, onQuickRegister, initialTab = 'ACTIVE', onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [viewType, setViewType] = useState<'NEW' | 'ACTIVE'>(initialTab);
  const [recentlyExited, setRecentlyExited] = useState<string[]>([]);

  useEffect(() => { setViewType(initialTab); }, [initialTab]);

  const filteredSearch = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];

    const namesInside = activeReports.map(r => r.partnerName.trim().toLowerCase());

    return partners.filter(p => {
      const isMatch = p.name.toLowerCase().includes(term);
      const isAlreadyInside = namesInside.includes(p.name.trim().toLowerCase());
      const isActive = !p.status || p.status.toLowerCase() === 'ativo';
      return isMatch && !isAlreadyInside && isActive;
    }).slice(0, 5);
  }, [partners, searchTerm, activeReports]);

  const activeByCompany = useMemo(() => {
    const grouped: Record<string, StayReport[]> = {};
    activeReports
      .filter(r => !recentlyExited.includes(r.partnerName))
      .forEach(r => {
        if (!grouped[r.company]) grouped[r.company] = [];
        grouped[r.company].push(r);
      });
    return grouped;
  }, [activeReports, recentlyExited]);

  const handleRegister = (partnerName: string, type: 'ENTRY' | 'EXIT') => {
    if (type === 'EXIT') setRecentlyExited(prev => [...prev, partnerName]);
    setSelectedPartner(null);
    setSearchTerm('');
    onQuickRegister(partnerName, type).then(ok => {
      if (ok) onRegistered();
      else setRecentlyExited(prev => prev.filter(n => n !== partnerName));
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex bg-slate-100 p-1 rounded-2xl mx-2 shadow-inner">
        <button 
          onClick={() => setViewType('ACTIVE')}
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${viewType === 'ACTIVE' ? 'bg-white text-[#5b806d] shadow-sm' : 'text-slate-400'}`}
        >
          QUEM ESTÁ NA PLANTA?
        </button>
        <button 
          onClick={() => setViewType('NEW')}
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${viewType === 'NEW' ? 'bg-white text-[#5b806d] shadow-sm' : 'text-slate-400'}`}
        >
          NOVA ENTRADA
        </button>
      </div>

      {viewType === 'NEW' ? (
        <div className="space-y-6 px-2">
          <div className="relative">
            <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador ativo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedPartner(null); }}
              className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-4 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5b806d]/20"
              autoFocus
            />
          </div>

          {!selectedPartner && searchTerm.trim().length >= 2 && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50">
              {filteredSearch.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedPartner(p)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-800 uppercase tracking-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{p.company}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 text-[#5b806d] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
              {filteredSearch.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-sm">Nenhum colaborador ativo disponível.</div>
              )}
            </div>
          )}

          {selectedPartner && (
            <div className="bg-white p-6 rounded-[42px] border-2 border-[#5b806d] shadow-2xl space-y-6 animate-in zoom-in-95 mx-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[24px] bg-slate-50 text-[#5b806d] flex items-center justify-center font-bold text-2xl border border-slate-100">
                  {selectedPartner.name.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-bold text-slate-800 uppercase leading-tight tracking-tight">{selectedPartner.name}</h4>
                  <p className="text-xs font-bold text-[#5b806d] uppercase tracking-[0.2em]">{selectedPartner.company}</p>
                </div>
              </div>
              <button
                onClick={() => handleRegister(selectedPartner.name, 'ENTRY')}
                className="w-full bg-[#5b806d] text-white rounded-[24px] py-5 font-bold shadow-lg shadow-[#5b806d]/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ICONS.LogIn className="w-6 h-6" />
                <span className="text-[10px] tracking-[0.3em] font-black">REGISTRAR ENTRADA</span>
              </button>
              <button onClick={() => setSelectedPartner(null)} className="w-full text-slate-300 text-[10px] font-black uppercase tracking-[0.25em] py-2">Cancelar</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 px-2">
          {Object.entries(activeByCompany).length > 0 ? (Object.entries(activeByCompany) as [string, StayReport[]][]).map(([company, reports]) => (
            <div key={company} className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5b806d] animate-pulse"></div>
                {company} <span className="text-slate-200 ml-1">({reports.length})</span>
              </h3>
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm divide-y divide-slate-50">
                {reports.map((report, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-bold text-slate-700 text-sm uppercase tracking-tight leading-none">{report.partnerName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Entrada: {report.entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button 
                      onClick={() => handleRegister(report.partnerName, 'EXIT')}
                      className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors active:scale-90"
                    >
                      SAÍDA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="p-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto opacity-20">
                <ICONS.Users className="w-8 h-8" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Ninguém na planta no momento.</p>
            </div>
          )}
        </div>
      )}

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

export default Registration;
