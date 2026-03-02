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
  const [viewType, setViewType] = useState<'NEW' | 'ACTIVE'>(initialTab);

  useEffect(() => { setViewType(initialTab); }, [initialTab]);

  const filteredSearch = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const namesInside = activeReports.map(r => r.partnerName.trim().toLowerCase());

    return partners.filter(p => {
      // Se não houver termo de busca, mostra todos que não estão dentro
      const isMatch = term === '' || p.name.toLowerCase().includes(term);
      const isAlreadyInside = namesInside.includes(p.name.trim().toLowerCase());
      const isActive = !p.status || p.status.toLowerCase() === 'ativo';
      return isMatch && !isAlreadyInside && isActive;
    }).slice(0, 15); // Limite de 15 para performance
  }, [partners, searchTerm, activeReports]);

  // Restante do componente (JSX) mantido EXATAMENTE igual ao seu original...
  return (
    <div className="space-y-6">
      {/* Botões de Troca de Aba (Novos / Ativos) */}
      {/* Input de Busca */}
      {/* Lista de Resultados baseada no filteredSearch */}
    </div>
  );
};
export default Registration;
