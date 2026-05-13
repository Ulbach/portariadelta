
import React, { useState, useMemo, useEffect } from 'react';
import { Partner, StayReport } from '../types';
import { ICONS } from '../constants';
import * as dataUtils from '../services/dataUtils';
import * as firebaseService from '../services/firebaseService';
import BulkImport from './BulkImport';

interface PartnersListProps {
  partners: Partner[];
  companies: string[];
  activeReports: StayReport[];
  loading: boolean;
  onQuickRegister: (name: string, type: 'ENTRY' | 'EXIT') => Promise<boolean>;
  onRefresh?: () => void;
  onBack?: () => void;
  onGoToCompanies?: () => void;
}

const PartnersList: React.FC<PartnersListProps> = ({ 
  partners, 
  companies, 
  activeReports, 
  loading, 
  onQuickRegister, 
  onRefresh, 
  onBack,
  onGoToCompanies
}) => {
  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyRegistered, setRecentlyRegistered] = useState<string[]>([]);

  useEffect(() => {
    if (!activeTab && companies.length > 0) {
      setActiveTab(companies[0]);
    }
  }, [companies, activeTab]);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const isFromCompany = p.company === activeTab;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const isActive = !p.status || p.status.toLowerCase() === 'ativo';
      const isInside = activeReports.some(r => 
        dataUtils.normalize(r.partnerName) === dataUtils.normalize(p.name) && !r.exitTime
      );
      const isRecentlyAdded = recentlyRegistered.includes(p.name);
      
      return isFromCompany && matchesSearch && isActive && !isInside && !isRecentlyAdded;
    });
  }, [partners, activeTab, searchTerm, activeReports, recentlyRegistered]);

  const handleAction = (partner: Partner) => {
    setRecentlyRegistered(prev => [...prev, partner.name]);
    onQuickRegister(partner.name, 'ENTRY').then(success => {
      if (!success) setRecentlyRegistered(prev => prev.filter(name => name !== partner.name));
    });
  };

  if (loading && partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Carregando parceiros...
        </div>
        {onBack && (
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider rounded-xl active:scale-95 transition-all"
          >
            Sair do Carregamento
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Colaboradores Ativos</h2>
        {onGoToCompanies && (
          <button 
            onClick={onGoToCompanies}
            className="text-[9px] font-black text-[#5b806d] uppercase tracking-widest flex items-center gap-1 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
          >
            <ICONS.Settings className="w-3 h-3" />
            Manutenção
          </button>
        )}
      </div>

      <div className="relative mx-2">
        <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar colaborador ativo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b806d]/20 shadow-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-2 no-scrollbar items-center">
        {companies.map(company => (
          <button
            key={company}
            onClick={() => setActiveTab(company)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              activeTab === company 
                ? 'bg-[#5b806d] text-white border-[#5b806d] shadow-lg' 
                : 'bg-white text-slate-500 border-slate-100'
            }`}
          >
            {company}
          </button>
        ))}
        
        {companies.length === 0 && (
          <p className="text-[10px] text-slate-400 font-bold uppercase p-2">Nenhuma empresa ativa.</p>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden mx-2">
        <div className="p-4 bg-slate-50/50 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredPartners.length} Disponíveis</p>
          <BulkImport company={activeTab} onSuccess={() => onRefresh?.()} />
        </div>
        
        {filteredPartners.length > 0 ? filteredPartners.map(partner => (
          <button 
            key={partner.id} 
            onClick={() => handleAction(partner)}
            className="w-full p-5 flex items-center justify-between group active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-[#5b806d] flex items-center justify-center font-bold">
                {partner.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800 uppercase tracking-tight leading-none">{partner.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{partner.company}</p>
              </div>
            </div>
            <div className="bg-slate-50 text-[#5b806d] p-2 rounded-xl group-hover:bg-[#5b806d] group-hover:text-white transition-all">
              <ICONS.LogIn className="w-5 h-5" />
            </div>
          </button>
        )) : (
          <div className="p-16 text-center text-slate-400 italic text-sm">Nenhum colaborador ativo nesta busca.</div>
        )}
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

export default PartnersList;
