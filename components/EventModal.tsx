import React, { useState } from 'react';
import { Scenario, Language, ScenarioOption, TacticType } from '../types';
import { TEXT, TACTICS } from '../constants';

interface EventModalProps {
  scenario: Scenario;
  onOptionSelect: (option: ScenarioOption, tactic: TacticType, cost: number) => void;
  lang: Language;
  isLoading: boolean;
  currentFunds: number;
}

export const EventModal: React.FC<EventModalProps> = ({ scenario, onOptionSelect, lang, isLoading, currentFunds }) => {
  const t = TEXT[lang];
  const [selectedTactic, setSelectedTactic] = useState<TacticType>('none');

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full text-center shadow-2xl animate-pulse">
            <div className="mb-4 text-4xl">🏛️ 🧠</div>
            <h3 className="text-xl font-serif text-slate-200">{t.loading}</h3>
            <p className="text-slate-500 text-sm mt-2">Calculating political fallout...</p>
        </div>
      </div>
    );
  }

  const tactics = TACTICS[lang];
  const activeTactic = tactics.find(tac => tac.type === selectedTactic)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-50 text-slate-900 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b-4 border-red-600 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-red-500 animate-pulse">● {t.eventTitle}</span>
            <h2 className="text-2xl md:text-3xl font-serif font-black leading-tight mt-1">
                {scenario.title}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Scenario & Choices */}
            <div className="p-6 md:w-2/3">
                <p className="text-lg text-slate-700 leading-relaxed font-serif mb-8 border-l-4 border-slate-300 pl-4 italic">
                    "{scenario.description}"
                </p>

                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">{t.choose}</h4>
                
                <div className="space-y-3">
                    {scenario.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => onOptionSelect(option, selectedTactic, activeTactic.cost)}
                        className="w-full text-left p-4 rounded-lg border-2 border-slate-200 hover:border-blue-600 hover:bg-slate-50 transition-all group relative overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 group-hover:text-blue-900 font-serif">{option.text}</span>
                            <span className={`text-[10px] px-2 py-1 rounded ml-2 uppercase font-bold tracking-wider
                                ${option.strategy === 'aggressive' ? 'bg-red-100 text-red-600' : 
                                  option.strategy === 'corrupt' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>
                                {option.strategy}
                            </span>
                        </div>
                    </button>
                    ))}
                </div>
            </div>

            {/* Tactics Sidebar */}
            <div className="bg-slate-100 p-6 md:w-1/3 border-l border-slate-200">
                 <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">{t.tactics}</h4>
                 <div className="space-y-2">
                    {tactics.map((tactic) => {
                        const canAfford = currentFunds >= tactic.cost;
                        return (
                            <button
                                key={tactic.type}
                                onClick={() => canAfford && setSelectedTactic(tactic.type)}
                                disabled={!canAfford}
                                className={`w-full p-3 rounded text-left border-2 transition-all
                                    ${selectedTactic === tactic.type 
                                        ? 'border-green-500 bg-white shadow-md' 
                                        : 'border-transparent hover:bg-slate-200 bg-slate-200/50'}
                                    ${!canAfford ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{tactic.name}</span>
                                    <span className={`text-xs font-mono ${selectedTactic === tactic.type ? 'text-green-600' : 'text-slate-500'}`}>
                                        ${tactic.cost / 1000}k
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-tight">
                                    {tactic.description}
                                </p>
                            </button>
                        );
                    })}
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-300 text-center">
                    <span className="text-xs text-slate-400">Current Balance</span>
                    <div className={`font-mono font-bold ${currentFunds < activeTactic.cost ? 'text-red-500' : 'text-slate-700'}`}>
                        ${(currentFunds - activeTactic.cost).toLocaleString()}
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};