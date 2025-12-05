import React from 'react';
import { ScenarioResult, Language } from '../types';
import { TEXT } from '../constants';

interface ResultModalProps {
  result: ScenarioResult;
  onClose: () => void;
  lang: Language;
}

export const ResultModal: React.FC<ResultModalProps> = ({ result, onClose, lang }) => {
  const t = TEXT[lang];

  const isGoodPoll = result.pollingChange >= 0;
  const isGoodFund = result.fundChange >= 0;
  const isScandal = result.scandalChange > 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 relative">
        <h2 className="text-2xl font-serif font-bold mb-4 text-white border-b border-slate-700 pb-2">{t.outcome}</h2>
        
        <p className="text-slate-300 mb-6 leading-relaxed font-light text-lg">
          {result.outcomeDescription}
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
            <span className="text-slate-400 text-sm uppercase tracking-widest">Polling</span>
            <span className={`font-mono font-bold text-xl ${isGoodPoll ? 'text-green-400' : 'text-red-400'}`}>
              {result.pollingChange > 0 ? '+' : ''}{result.pollingChange}%
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
             <span className="text-slate-400 text-sm uppercase tracking-widest">Funds</span>
            <span className={`font-mono font-bold text-xl ${isGoodFund ? 'text-green-400' : 'text-red-400'}`}>
              {result.fundChange > 0 ? '+' : ''}${result.fundChange.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
             <span className="text-slate-400 text-sm uppercase tracking-widest">Scandal</span>
            <span className={`font-mono font-bold text-xl ${isScandal ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
              {result.scandalChange > 0 ? '+' : ''}{result.scandalChange}
            </span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-slate-900 font-black tracking-widest uppercase rounded hover:bg-slate-200 shadow-lg transition-transform hover:scale-[1.02]"
        >
          Continue Campaign
        </button>
      </div>
    </div>
  );
};