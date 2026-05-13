
import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Partner } from '../types';
import * as firebaseService from '../services/firebaseService';
import { ICONS } from '../constants';

interface BulkImportProps {
  company: string;
  onSuccess: () => void;
}

const BulkImport: React.FC<BulkImportProps> = ({ company, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const partners: Omit<Partner, 'id'>[] = data.map(row => {
          // Normalize status
          let status: 'Ativo' | 'Inativo' = 'Ativo';
          const rawStatus = (row.status || row.Status || '').toString().trim().toLowerCase();
          if (rawStatus === 'inativo') status = 'Inativo';

          // Fixed discount hours
          const rawDiscount = (row.descFixo || row.DescFixo || '0').toString().replace(',', '.');
          const fixedDiscountHours = parseFloat(rawDiscount) || 0;

          return {
            name: (row.name || row.Nome || '').toString().trim(),
            role: (row.role || row.Cargo || '').toString().trim(),
            document: (row.document || row.Documento || row.CPF || '').toString().trim(),
            company: company,
            status: status,
            fixedDiscountHours: fixedDiscountHours
          };
        }).filter(p => p.name.length > 0);

        if (partners.length === 0) {
          alert('Nenhum dado válido encontrado no CSV.');
          setImporting(false);
          return;
        }

        if (confirm(`Deseja importar ${partners.length} colaboradores para a empresa ${company}?`)) {
          const success = await firebaseService.bulkAddPartners(partners);
          if (success) {
            alert('Importação concluída com sucesso!');
            onSuccess();
          } else {
            alert('Falha na importação.');
          }
        }
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error('Erro no CSV:', error);
        alert('Erro ao processar o arquivo CSV.');
        setImporting(false);
      }
    });
  };

  if (!company) return null;

  return (
    <div className="inline-block">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={importing || !company}
        title="Colunas CSV: Nome, Cargo, Documento, Status, DescFixo"
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
          importing ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-white text-[#5b806d] border border-slate-100 hover:bg-[#5b806d] hover:text-white shadow-sm'
        }`}
      >
        <ICONS.Plus className="w-3 h-3" />
        {importing ? 'Importando...' : 'Importar Lista'}
      </button>
    </div>
  );
};

export default BulkImport;
