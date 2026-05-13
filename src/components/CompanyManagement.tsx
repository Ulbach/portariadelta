
import React, { useState } from 'react';
import { Company } from '../types';
import { ICONS } from '../constants';
import * as firebaseService from '../services/firebaseService';

interface CompanyManagementProps {
  companies: Company[];
  loading: boolean;
  onRefresh?: () => void;
  onBack?: () => void;
}

const CompanyManagement: React.FC<CompanyManagementProps> = ({ companies, loading, onRefresh, onBack }) => {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsAdding(true);
    const success = await firebaseService.addCompany(newCompanyName.trim());
    if (success) {
      setNewCompanyName('');
      onRefresh?.();
    }
    setIsAdding(false);
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.status === 'Ativa' ? 'Inativa' : 'Ativa';
    await firebaseService.updateCompany(company.id, { status: newStatus });
    onRefresh?.();
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await firebaseService.updateCompany(editingId, { name: editName.trim() });
    setEditingId(null);
    onRefresh?.();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="px-2">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Manutenção de Empresas</h2>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Gerencie o status e o cadastro das empresas parceiras.</p>
      </div>

      {/* Add New Company Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mx-2 space-y-4">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nova Empresa</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="NOME DA EMPRESA..."
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#5b806d]/20"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()}
          />
          <button 
            onClick={handleAddCompany}
            disabled={isAdding || !newCompanyName.trim()}
            className="bg-[#5b806d] text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {isAdding ? '...' : 'ADICIONAR'}
          </button>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mx-2">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{companies.length} Cadastradas</p>
        </div>
        
        <div className="divide-y divide-slate-50">
          {companies.length > 0 ? companies.map(company => (
            <div key={company.id} className="p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                    company.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {company.name.charAt(0)}
                  </div>
                  
                  {editingId === company.id ? (
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-100 border-none rounded-lg px-2 py-1 text-sm font-bold uppercase tracking-tight focus:outline-none"
                      autoFocus
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm tracking-tight uppercase ${company.status === 'Inativa' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {company.name}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        company.status === 'Ativa' ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        {company.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (editingId === company.id) {
                        handleSaveEdit();
                      } else {
                        setEditingId(company.id);
                        setEditName(company.name);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-[#5b806d] transition-colors"
                  >
                    <ICONS.History className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(company)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      company.status === 'Ativa' 
                        ? 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500' 
                        : 'bg-[#5b806d] text-white hover:brightness-110'
                    }`}
                  >
                    {company.status === 'Ativa' ? 'DESATIVAR' : 'ATIVAR'}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-16 text-center text-slate-400 italic text-sm">Nenhuma empresa cadastrada.</div>
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

export default CompanyManagement;
