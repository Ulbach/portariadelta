import React from 'react';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-slate-100/80 px-8 py-14">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-28 h-28 rounded-[34px] bg-[#698c78] shadow-[0_0_0_10px_rgba(105,140,120,0.12)] flex items-center justify-center mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-14 h-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="3" y="14" width="7" height="5" rx="1.5" />
            <rect x="14" y="11" width="7" height="8" rx="1.5" />
          </svg>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-[34px] leading-[1] font-black text-slate-900">
            Portaria
          </h1>
          <h2 className="text-[34px] leading-[1] font-black text-[#698c78] mt-1">
            Inteligente
          </h2>
          <p className="mt-4 text-[11px] tracking-[0.45em] font-black text-slate-400 uppercase">
            # Delta Geração #
          </p>
        </div>

        <button
          onClick={onStart}
          className="w-full max-w-sm bg-[#698c78] text-white py-5 rounded-[24px] shadow-xl text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <span>Acesso de Parceiros</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="pt-8 flex justify-center items-center opacity-30 select-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
          - BY ULBACH -
        </p>
      </div>
    </div>
  );
};

export default Welcome;
