
import React from 'react';
import { ICONS } from '../constants';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-between py-12 px-6 text-center animate-fade-in">
      {/* Cabeçalho / Logo Area */}
      <div className="space-y-6 mt-10">
        <div className="w-24 h-24 bg-[#5b806d] rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-[#5b806d]/30 ring-8 ring-[#5b806d]/10">
          <ICONS.Dashboard className="w-12 h-12 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
            Portaria<br/>
            <span className="text-[#5b806d]">Inteligente</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em]">
            # DELTA GERAÇÃO #
          </p>
        </div>
      </div>

      {/* Botões Centrais */}
      <div className="w-full max-w-xs mx-auto mt-12">
        <button 
          onClick={onStart}
          className="w-full bg-[#5b806d] text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5b806d]/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          <span>Acesso de Parceiros</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Espaçador para manter o layout flex-col justify-between */}
      <div className="h-20"></div>
    </div>
  );
};

export default Welcome;
