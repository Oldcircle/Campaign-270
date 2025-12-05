import React, { useState, useEffect } from 'react';
import { GameState, StateData, Language, Scenario, ScenarioOption, ScenarioResult, AIConfig, TacticType } from './types';
import { INITIAL_FUNDS, INITIAL_ENERGY, MAX_DAYS, WINNING_THRESHOLD, INITIAL_STATES, TEXT, PROVIDERS } from './constants';
import { generateStateScenario, evaluateChoice } from './services/geminiService';
import { StatsBoard } from './components/StatsBoard';
import { HexMap } from './components/HexMap';
import { EventModal } from './components/EventModal';
import { ResultModal } from './components/ResultModal';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // Config State
  const [lang, setLang] = useState<Language>('en');
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    // Try load from local storage
    const saved = localStorage.getItem('ai_configs');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
    }
    return {
        id: 'default',
        name: 'Default',
        provider: 'google',
        apiKey: process.env.API_KEY || '',
        modelName: 'gemini-2.5-flash'
    };
  });

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    funds: INITIAL_FUNDS,
    energy: INITIAL_ENERGY,
    day: MAX_DAYS,
    electoralVotes: 0,
    scandal: 0,
    nationalPolling: 45,
    states: JSON.parse(JSON.stringify(INITIAL_STATES)), // Deep copy
    history: [],
    gameOver: false,
    victory: null
  });

  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentResult, setCurrentResult] = useState<ScenarioResult | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Constants
  const t = TEXT[lang];

  // Effects
  useEffect(() => {
    // Check win/loss condition
    if (gameStarted && !gameState.gameOver) {
      if (gameState.electoralVotes >= WINNING_THRESHOLD) {
        setGameState(prev => ({ ...prev, gameOver: true, victory: true }));
      } else if (gameState.day <= 0 || gameState.funds < 0 || gameState.energy <= 0) {
        setGameState(prev => ({ ...prev, gameOver: true, victory: false }));
      }
    }
  }, [gameState.electoralVotes, gameState.day, gameState.funds, gameState.energy, gameStarted, gameState.gameOver]);


  // Handlers
  const handleStateClick = async (state: StateData) => {
    if (gameState.gameOver || loading) return;

    if (!aiConfig.apiKey && aiConfig.provider !== 'ollama') { // Ollama might not need key
        setShowSettings(true);
        return;
    }

    // Cost to travel
    const travelCost = 10000;
    const travelEnergy = 5;

    if (gameState.funds < travelCost || gameState.energy < travelEnergy) {
       alert("Not enough resources to travel!");
       return;
    }

    setLoading(true);
    setSelectedStateId(state.id);

    try {
      const scenario = await generateStateScenario(aiConfig, state.name, state.description, lang);
      setActiveScenario(scenario);
      
      // Deduct travel costs
      setGameState(prev => ({
        ...prev,
        funds: prev.funds - travelCost,
        energy: prev.energy - travelEnergy
      }));

    } catch (error) {
      console.error(error);
      alert("AI Connection Failed. Please check settings.");
      setShowSettings(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (option: ScenarioOption, tactic: TacticType, tacticCost: number) => {
    if (!activeScenario || !selectedStateId) return;
    
    // Deduct tactic cost
    if (gameState.funds < tacticCost) {
        alert("Cannot afford tactic!");
        return;
    }

    setLoading(true);
    setActiveScenario(null);

    try {
      const state = gameState.states.find(s => s.id === selectedStateId);
      if (!state) throw new Error("State not found");

      const result = await evaluateChoice(
        aiConfig,
        state.name, 
        activeScenario.description, 
        option.text, 
        option.strategy, 
        tactic,
        gameState.funds - tacticCost,
        gameState.scandal,
        lang
      );

      setCurrentResult(result);
      
      // Update Game State
      setGameState(prev => {
        // Apply tactic cost immediately along with result changes
        let newFunds = prev.funds - tacticCost + result.fundChange;
        let newEnergy = prev.energy + result.energyChange;
        let newScandal = Math.max(0, Math.min(100, prev.scandal + result.scandalChange));

        const newStates = prev.states.map(s => {
          if (s.id === selectedStateId) {
            // Scandal Cap: If scandal is high (>60), hard to get >55% polling
            let cap = 100;
            if (newScandal > 60) cap = 55;
            if (newScandal > 80) cap = 45;

            const rawPolling = s.polling + result.pollingChange;
            const newPolling = Math.min(cap, Math.max(0, rawPolling));
            
            return { ...s, polling: newPolling, status: 'visited' as any };
          }
          return s;
        });

        // Calculate Projected EV
        const currentEV = newStates.reduce((acc, s) => {
             return (s.polling > 50) ? acc + s.electoralVotes : acc;
        }, 0);

        return {
          ...prev,
          funds: newFunds,
          energy: newEnergy,
          scandal: newScandal,
          states: newStates,
          electoralVotes: currentEV,
        };
      });

    } catch (error) {
      console.error(error);
      alert("AI Evaluation Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextDay = () => {
    setCurrentResult(null);
    setSelectedStateId(null);
    setGameState(prev => ({
      ...prev,
      day: prev.day - 1
    }));
  };

  const restartGame = () => {
    setGameState({
        funds: INITIAL_FUNDS,
        energy: INITIAL_ENERGY,
        day: MAX_DAYS,
        electoralVotes: 0,
        scandal: 0,
        nationalPolling: 45,
        states: JSON.parse(JSON.stringify(INITIAL_STATES)),
        history: [],
        gameOver: false,
        victory: null
    });
    setGameStarted(true);
  };

  // Views
  if (!gameStarted) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white relative overflow-hidden">
        {/* Background Decal */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900 rounded-full blur-[120px]"></div>
        </div>

        <div className="z-10 text-center space-y-8 max-w-xl p-6">
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-white drop-shadow-2xl">
                CAMPAIGN
            </h1>
            <div className="text-3xl md:text-4xl font-serif tracking-widest text-red-500 font-bold -mt-4 mb-8">
                270
            </div>
            
            <p className="text-xl text-slate-300 font-serif italic">
                "{lang === 'en' ? 'Power is not given. It is taken.' : '权力不是赐予的，是夺取的。'}"
            </p>
            
            <p className="text-slate-400 text-sm border-t border-b border-slate-800 py-4 max-w-md mx-auto">
                {t.instruction}
            </p>

            <div className="flex justify-center gap-4">
                 <button 
                    onClick={() => setLang('en')} 
                    className={`px-4 py-1 rounded text-xs ${lang === 'en' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400'}`}>
                    English
                 </button>
                 <button 
                    onClick={() => setLang('zh')} 
                    className={`px-4 py-1 rounded text-xs ${lang === 'zh' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    中文
                 </button>
            </div>

            <div className="flex flex-col gap-4 items-center">
                <button 
                    onClick={restartGame}
                    className="w-64 py-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white font-black uppercase tracking-widest text-xl rounded shadow-2xl hover:scale-105 transition-transform border border-blue-500"
                >
                    {t.start}
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="text-slate-500 text-sm hover:text-slate-300 underline"
                >
                    {t.configure}
                </button>
            </div>
        </div>

        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            currentConfigId={aiConfig.id}
            onConfigChange={setAiConfig}
            language={lang}
        />
      </div>
    );
  }

  if (gameState.gameOver) {
      return (
          <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white p-4">
             <div className="max-w-2xl w-full bg-slate-900 p-8 rounded-xl shadow-2xl text-center border border-slate-700">
                <h2 className="text-xl uppercase tracking-widest text-slate-500 mb-6">{t.gameOver}</h2>
                
                <div className="py-8 border-y border-slate-800 mb-8">
                    <h1 className={`text-5xl md:text-7xl font-serif font-black mb-4 ${gameState.victory ? 'text-blue-500' : 'text-slate-400'}`}>
                        {gameState.victory ? 'VICTORY' : 'DEFEAT'}
                    </h1>
                    <p className="text-lg text-slate-300 italic max-w-lg mx-auto">
                        {gameState.victory ? t.winDesc : t.loseDesc}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-8 font-mono">
                    <div className="p-4 bg-slate-800 rounded">
                        <div className="text-[10px] uppercase text-slate-500">Votes</div>
                        <div className="text-2xl font-bold text-white">{gameState.electoralVotes}</div>
                    </div>
                     <div className="p-4 bg-slate-800 rounded">
                        <div className="text-[10px] uppercase text-slate-500">Funds</div>
                        <div className="text-2xl font-bold text-green-500">${(gameState.funds/1000).toFixed(0)}k</div>
                    </div>
                    <div className="p-4 bg-slate-800 rounded">
                        <div className="text-[10px] uppercase text-slate-500">Scandal</div>
                        <div className="text-2xl font-bold text-red-500">{gameState.scandal}</div>
                    </div>
                </div>

                <button 
                    onClick={restartGame}
                    className="px-8 py-3 bg-white text-slate-900 font-bold uppercase tracking-wider rounded hover:bg-slate-200 transition-colors"
                >
                    {t.restart}
                </button>
             </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      <StatsBoard gameState={gameState} lang={lang} onOpenSettings={() => setShowSettings(true)} />
      
      <main className="flex-1 relative overflow-hidden flex flex-col items-center">
         <div className="w-full max-w-7xl h-full">
            <HexMap states={gameState.states} onStateClick={handleStateClick} lang={lang} />
         </div>
      </main>

      {/* Modals */}
      {(loading || activeScenario) && (
        <EventModal 
            scenario={activeScenario || {title:'', description:'', options:[]}} 
            onOptionSelect={handleOptionSelect}
            lang={lang}
            isLoading={loading && !activeScenario}
            currentFunds={gameState.funds}
        />
      )}

      {currentResult && (
        <ResultModal 
            result={currentResult} 
            onClose={handleNextDay} 
            lang={lang}
        />
      )}

      <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            currentConfigId={aiConfig.id}
            onConfigChange={setAiConfig}
            language={lang}
      />
    </div>
  );
};

export default App;