import React, { useState, useMemo, useEffect } from 'react';
import { Partner, StayReport } from '../types';
import { ICONS } from '../constants';

interface RegistrationProps {
  partners: Partner[];
  activeReports: StayReport[];
  onQuickRegister: (partnerName: string, type: 'ENTRY' | 'EXIT') => void | Promise<void>;
  initialTab?: 'NEW' | 'ACTIVE';
  onBack: () => void;
}

const Registration: React.FC<RegistrationProps> = ({
  partners,
  activeReports,
  onQuickRegister,
  initialTab = 'ACTIVE',
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'NEW' | 'ACTIVE'>(initialTab);
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

  useEffect(() => {
    setViewType(initialTab);
  }, [initialTab]);

  const companies = useMemo(() => {
    const unique = Array.from(
      new Set(
        partners
          .map((p) => (p.company || '').trim())
          .filter(Boolean)
      )
    );

    return unique.sort((a, b) => a.localeCompare(b));
  }, [partners]);

  const activeNamesInside = useMemo(() => {
    return activeReports.map((r) => r.partnerName.trim().toLowerCase());
  }, [activeReports]);

  const filteredNewPartners = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return partners
      .filter((p) => {
        const isMatch = p.name.toLowerCase().includes(term);
        const isAlreadyInside = activeNamesInside.includes(
          p.name.trim().toLowerCase()
        );
        const isActive =
          p.status?.toString().trim().toLowerCase() === 'ativo';

        const matchesCompany =
          selectedCompany === 'ALL' || p.company === selectedCompany;

        return isMatch && !isAlreadyInside && isActive && matchesCompany;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50);
  }, [partners, searchTerm, activeNamesInside, selectedCompany]);

  const filteredActiveReports = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return activeReports
      .filter((r) => {
        const matchesSearch = r.partnerName.toLowerCase().includes(term);
        const matchesCompany =
          selectedCompany === 'ALL' || r.company === selectedCompany;

        return matchesSearch && matchesCompany;
      })
      .sort((a, b) => a.partnerName.localeCompare(b.partnerName));
  }, [activeReports, searchTerm, selectedCompany]);

  const companyButtons = companies.slice(0, 3);

  const renderCompanyFilters = () => {
    if (companyButtons.length === 0) return null;

    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {companyButtons.map((company) => {
          const isSelected = selectedCompany === company;

          return (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
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

        {selectedCompany !== 'ALL' && (
          <button
            onClick={() => setSelectedCompany('ALL')}
            className="min-w-[90px] px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wide bg-slate-100 text-slate-500"
          >
            Todas
          </button>
        )}
      </div>
    );
  };

  const renderInitialBadge = (name: string) => {
    const letter = name?.trim()?.charAt(0)?.toUpperCase() || '?';

    return (
      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#698c78] flex items-center justify-center font-black text-lg shrink-0">
        {letter}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-100/80 px-6 pt-4 pb-10">
      <div className="space-y-4">
        {/* TABS */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setViewType('NEW')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              viewType === 'NEW'
                ? 'bg-[#698c78] text-white'
                : 'text-slate-400'
            }`}
          >
            Novos
          </button>

          <button
            onClick={() => setViewType('ACTIVE')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              viewType === 'ACTIVE'
                ? 'bg-[#698c78] text-white'
                : 'text-slate-400'
            }`}
          >
            Ativos
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <ICONS.Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder={
              viewType === 'NEW'
                ? 'Buscar colaborador ativo...'
                : 'Buscar colaborador na planta...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* COMPANY FILTERS */}
        {renderCompanyFilters()}

        {/* CONTENT */}
        {viewType === 'NEW' ? (
          <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                {filteredNewPartners.length} Disponíveis
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredNewPartners.length > 0 ? (
                filteredNewPartners.map((p) => (
                  <div
                    key={p.id}
                    className="px-6 py-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {renderInitialBadge(p.name)}

                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm leading-tight truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-wide mt-1 truncate">
                          {p.company}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onQuickRegister(p.name, 'ENTRY')}
                      className="w-11 h-11 rounded-2xl bg-slate-50 text-[#698c78] flex items-center justify-center shrink-0 border border-slate-100 active:scale-95 transition-all"
                      aria-label={`Registrar entrada de ${p.name}`}
                    >
                      <ICONS.LogIn className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-6 py-14 text-center text-slate-400 text-sm">
                  Nenhum colaborador ativo encontrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                {filteredActiveReports.length} Na Planta
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredActiveReports.length > 0 ? (
                filteredActiveReports.map((r, index) => (
                  <div
                    key={`${r.recordId || r.partnerName}-${index}`}
                    className="px-6 py-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {renderInitialBadge(r.partnerName)}

                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm leading-tight truncate">
                          {r.partnerName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-wide mt-1 truncate">
                          {r.company}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onQuickRegister(r.partnerName, 'EXIT')}
                      className="w-11 h-11 rounded-2xl bg-slate-50 text-rose-600 flex items-center justify-center shrink-0 border border-slate-100 active:scale-95 transition-all"
                      aria-label={`Registrar saída de ${r.partnerName}`}
                    >
                      <ICONS.LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-6 py-14 text-center text-slate-400 text-sm">
                  Nenhum colaborador na planta.
                </div>
              )}
            </div>
          </div>
        )}

        {/* BACK BUTTON */}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar ao Início</span>
          </button>
        </div>

        {/* SIGNATURE */}
        <div className="pt-8 flex justify-center items-center opacity-30 select-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
            - BY ULBACH -
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
