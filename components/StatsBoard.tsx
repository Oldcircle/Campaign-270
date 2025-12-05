import React from 'react';
import { GameState, Language } from '../types';
import { TEXT, WINNING_THRESHOLD } from '../constants';

interface StatsBoardProps {
  gameState: GameState;
  lang: Language;
  onOpenSettings: () => void;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ gameState, lang, onOpenSettings }) => {
  const t = TEXT[lang];

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 shadow-2xl flex flex-wrap justify-between items-center sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button onClick={onOpenSettings} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            ⚙️
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-red-700 rounded-full flex items-center justify-center font-bold text-white font-serif border-2 border-slate-600">
          270
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold font-serif leading-tight text-slate-100">{t.title}</h1>
          <span className="text-xs text-slate-400">{t.subtitle}</span>
        </div>
      </div>

      <div className="flex space-x-4 md:space-x-8 text-sm md:text-base overflow-x-auto">
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.votes}</span>
          <div className="font-bold text-2xl text-blue-400 leading-none">
            {gameState.electoralVotes} <span className="text-slate-600 text-sm">/ {WINNING_THRESHOLD}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.funds}</span>
          <div className="font-bold text-green-400 leading-none">
            ${(gameState.funds / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="flex flex-col items-center">
           <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.scandal}</span>
           <div className={`font-bold leading-none ${gameState.scandal > 50 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
             {gameState.scandal}%
           </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.days}</span>
          <div className="font-bold text-yellow-400 leading-none">
            {gameState.day}
          </div>
        </div>
        
         <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.energy}</span>
          <div className="font-bold text-purple-400 leading-none">
            {gameState.energy}
          </div>
        </div>
      </div>
    </div>
  );
};