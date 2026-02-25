
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, CompanyReport } from '../types';
import * as sheetService from '../services/sheetService';

interface ReportsProps {
  records: AttendanceRecord[];
  loading: boolean;
  onBack?: () => void;
}

const Reports: React.FC<ReportsProps> = ({ records, loading, onBack }) => {
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [selectedCompany, setSelectedCompany] = useState<string>('TODAS');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  const companyReports = useMemo(() => 
    sheetService.generateCompanyReports(records, reportType), 
    [records, reportType]
  );

  const companies = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.company));
    return ['TODAS', ...Array.from(set).sort()];
  }, [records]);

  const filteredReports = useMemo(() => {
    if (selectedCompany === 'TODAS') return companyReports;
    return companyReports.filter(r => r.company === selectedCompany);
  }, [companyReports, selectedCompany]);

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatHour = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Filtros Superiores */}
      <div className="px-2 space-y-4">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl shadow-inner">
          <button 
            onClick={() => setReportType('DAILY')}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${reportType === 'DAILY' ? 'bg-[#5b806d] text-white shadow-md' : 'text-slate-500'}`}
          >
            RELATÓRIO DIÁRIO
          </button>
          <button 
            onClick={() => setReportType('MONTHLY')}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${reportType === 'MONTHLY' ? 'bg-[#5b806d] text-white shadow-md' : 'text-slate-500'}`}
          >
            RELATÓRIO MENSAL
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${selectedCompany === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="px-2 space-y-8">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#5b806d] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Processando Dados...</p>
          </div>
        ) : filteredReports.length > 0 ? filteredReports.map((report, rIdx) => (
          <div key={`${report.company}-${report.period}-${rIdx}`} className="space-y-4">
            {/* Header da Empresa/Período */}
            <div className="flex items-end justify-between px-2">
              <div>
                <p className="text-[9px] font-black text-[#5b806d] uppercase tracking-[0.3em] mb-1">Empresa</p>
                <h3 className="text-xl font-black text-slate-800 leading-none">{report.company}</h3>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Período</p>
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600">{report.period}</span>
              </div>
            </div>

            {/* Tabela de Colaboradores (Folha de Ponto) */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.partners.map((partner, pIdx) => {
                      const isExpanded = expandedPartner === `${report.company}-${report.period}-${partner.name}`;
                      return (
                        <React.Fragment key={pIdx}>
                          <tr className={`transition-colors ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                            <td className="p-4">
                              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{partner.name}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-[10px] font-black text-[#5b806d] bg-emerald-50 px-2 py-1 rounded-md">
                                {formatTime(partner.totalPeriodWork)}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => setExpandedPartner(isExpanded ? null : `${report.company}-${report.period}-${partner.name}`)}
                                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#5b806d] transition-colors"
                              >
                                {isExpanded ? 'Fechar' : 'Detalhes'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={3} className="p-0 bg-slate-50/30">
                                <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  {partner.days.map((day, dIdx) => (
                                    <div key={dIdx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span className="text-[10px] font-black text-slate-800">{day.date}</span>
                                        <span className="text-[9px] font-bold text-[#5b806d] uppercase">{formatTime(day.totalWork)}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {day.sessions.map((session, sIdx) => (
                                          <div key={sIdx} className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                            <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                              <span>{formatHour(session.entry)}</span>
                                              <span className="text-slate-300">→</span>
                                              <span className={session.exit ? '' : 'text-emerald-500 animate-pulse'}>
                                                {session.exit ? formatHour(session.exit) : 'PRESENTE'}
                                              </span>
                                            </div>
                                            <span className="text-[9px] text-slate-400">
                                              {session.duration > 0 ? formatTime(session.duration) : '-'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Rodapé do Card com Resumo da Empresa */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total da Empresa no Período</p>
                <p className="text-sm font-black text-slate-800">
                  {formatTime(report.partners.reduce((acc, p) => acc + p.totalPeriodWork, 0))}
                </p>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-32 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum registro encontrado para este filtro.</p>
          </div>
        )}
      </div>

      {/* Botão Voltar Fixo ou no final */}
      {onBack && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-50">
          <button 
            onClick={onBack}
            className="w-full py-4 bg-slate-900 text-white shadow-2xl font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
            Voltar ao Início
          </button>
        </div>
      )}
    </div>
  );
};

export default Reports;
