import React from 'react';
import { StateData, Language } from '../types';
import { TEXT } from '../constants';

interface HexMapProps {
  states: StateData[];
  onStateClick: (state: StateData) => void;
  lang: Language;
}

export const HexMap: React.FC<HexMapProps> = ({ states, onStateClick, lang }) => {
  const t = TEXT[lang];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 overflow-y-auto h-full pb-24">
      {states.map((state) => {
        const isWinning = state.polling > 50;
        const isVisited = state.status !== 'unvisited';
        
        let bgColor = 'bg-slate-700';
        let borderColor = 'border-slate-600';
        let textColor = 'text-slate-300';

        if (state.type === 'safe') borderColor = 'border-blue-800';
        if (state.type === 'hostile') borderColor = 'border-red-800';
        if (state.type === 'swing') borderColor = 'border-purple-600';

        if (isVisited) {
            if (isWinning) {
                bgColor = 'bg-blue-900/80';
                textColor = 'text-blue-100';
            } else {
                bgColor = 'bg-red-900/80';
                textColor = 'text-red-100';
            }
        }

        return (
          <button
            key={state.id}
            onClick={() => onStateClick(state)}
            disabled={isVisited}
            className={`
              relative group flex flex-col p-4 rounded-xl border-2 transition-all duration-300
              ${bgColor} ${borderColor} ${textColor}
              ${!isVisited ? 'hover:-translate-y-1 hover:shadow-xl hover:border-slate-400 cursor-pointer' : 'opacity-70 cursor-not-allowed'}
            `}
          >
            <div className="flex justify-between items-start w-full mb-2">
              <span className="text-2xl font-black font-serif opacity-50">{state.abbr}</span>
              <span className="text-xs px-2 py-1 bg-black/30 rounded-full font-mono">
                {state.electoralVotes} EV
              </span>
            </div>
            
            <h3 className="text-lg font-bold mb-1">
                {lang === 'en' ? state.name : state.name_zh}
            </h3>
            
            <div className="w-full bg-slate-900/50 rounded-full h-2 mt-2 mb-1 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${state.polling > 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                    style={{ width: `${state.polling}%` }}
                />
            </div>
            <div className="flex justify-between text-xs opacity-70 w-full">
                <span>R</span>
                <span>{state.polling}% Support</span>
                <span>D</span>
            </div>

            <div className="mt-2 text-xs italic opacity-0 group-hover:opacity-100 transition-opacity">
               {isVisited ? t.visited : (state.type === 'swing' ? `⚠ ${t.swing}` : state.type === 'safe' ? `🛡 ${t.safe}` : `⚔ ${t.hostile}`)}
            </div>
          </button>
        );
      })}
    </div>
  );
};
