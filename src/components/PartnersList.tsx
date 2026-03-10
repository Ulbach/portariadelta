import React, { useState, useMemo, useEffect } from 'react';
import { Partner, StayReport } from '../types';
import { ICONS } from '../constants';

interface PartnersListProps {
  partners: Partner[];
  companies: string[];
  activeReports: StayReport[];
  loading: boolean;
  onQuickRegister: (name: string, type: 'ENTRY' | 'EXIT') => Promise<boolean>;
  onBack?: () => void;
}

const PartnersList: React.FC<PartnersListProps> = ({
  partners,
  companies,
  activeReports,
  loading,
  onQuickRegister,
  onBack
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
    return partners.filter((p) => {
      const isFromCompany = p.company === activeTab;
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

      const isActive =
        !p.status || p.status.toString().trim().toLowerCase() === 'ativo';

      const isInside = activeReports.some(
        (r) =>
          r.partnerName.trim().toLowerCase() ===
            p.name.trim().toLowerCase() && !r.exitTime
      );

      const isRecentlyAdded = recentlyRegistered.includes(p.name);

      return (
        isFromCompany &&
        matchesSearch &&
        isActive &&
        !isInside &&
        !isRecentlyAdded
      );
    });
  }, [partners, activeTab, searchTerm, activeReports, recentlyRegistered]);

  const handleAction = (partner: Partner) => {
    setRecentlyRegistered((prev) => [...prev, partner.name]);

    onQuickRegister(partner.name, 'ENTRY').then((success) => {
      if (!success) {
        setRecentlyRegistered((prev) =>
          prev.filter((name) => name !== partner.name)
        );
      }
    });
  };

  if (loading && partners.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm animate-pulse">
        Carregando parceiros...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100/80 px-6 pt-4 pb-10">
      <div className="space-y-4">
        {/* BUSCA */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <ICONS.Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            placeholder="Buscar colaborador ativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* EMPRESAS */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {companies.map((company) => {
            const isSelected = activeTab === company;

            return (
              <button
                key={company}
                onClick={() => setActiveTab(company)}
                className={`min-w-[108px] px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all ${
                  isSelected
                    ? 'bg-[#698c78] text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {company}
              </button>
            );
          })}
        </div>

        {/* LISTA */}
        <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
              {filteredPartners.length} Disponíveis
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="px-6 py-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#698c78] flex items-center justify-center font-black text-lg shrink-0">
                      {partner.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 text-left">
                      <p className="font-black text-slate-800 text-sm leading-tight truncate uppercase">
                        {partner.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-wide mt-1 truncate">
                        {partner.company}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAction(partner)}
                    className="w-11 h-11 rounded-2xl bg-slate-50 text-[#698c78] flex items-center justify-center shrink-0 border border-slate-100 active:scale-95 transition-all"
                    aria-label={`Registrar entrada de ${partner.name}`}
                  >
                    <ICONS.LogIn className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-6 py-14 text-center text-slate-400 text-sm">
                Nenhum colaborador ativo nesta busca.
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO VOLTAR */}
        {onBack && (
          <div className="pt-6">
            <button
              onClick={onBack}
              className="w-full bg-[#698c78] text-white py-5 rounded-[24px] shadow-xl text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Voltar ao Início</span>
            </button>
          </div>
        )}

        {/* ASSINATURA */}
        <div className="pt-8 flex justify-center items-center opacity-30 select-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
            - BY ULBACH -
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnersList;
