
import React, { useState } from 'react';
import { ICONS } from '../constants';
import * as firebaseService from '../services/firebaseService';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    const user = await firebaseService.signInWithGoogle();
    setIsSigningIn(false);
    if (user) {
      onStart();
    } else {
      alert('Falha ao autenticar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-between py-12 px-6 text-center animate-fade-in">
      {/* Cabeçalho / Logo Area */}
      <div className="space-y-6 mt-6">
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-[#5b806d] rounded-[40px] rotate-6 opacity-20 animate-pulse"></div>
          <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl overflow-hidden border-4 border-white flex items-center justify-center p-4">
            <img 
              src="https://raw.githubusercontent.com/ulbach/portaria-inteligente/main/public/logo-delta.png" 
              alt="Delta Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback if the URL above doesn't work yet
                e.currentTarget.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&h=400&auto=format&fit=crop";
                e.currentTarget.className = "w-full h-full object-cover grayscale brightness-90";
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#5b806d] rounded-2xl flex items-center justify-center shadow-lg text-white border-4 border-white">
            <ICONS.Dashboard className="w-6 h-6" />
          </div>
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
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-gradient-to-br from-[#5b806d] to-[#436152] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(91,128,109,0.25)] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
        >
          <span>{isSigningIn ? 'Autenticando...' : 'Acessar Sistema'}</span>
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </button>
      </div>

      {/* Espaçador para manter o layout flex-col justify-between */}
      <div className="h-20"></div>
    </div>
  );
};

export default Welcome;
