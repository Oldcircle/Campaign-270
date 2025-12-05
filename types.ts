
export type Language = 'en' | 'zh';

export type AIProvider = 'google' | 'openai' | 'deepseek' | 'claude' | 'ollama' | 'grok' | 'openrouter';

export interface AIConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelName: string;
}

export interface GameState {
  funds: number; // Campaign money
  energy: number; // Stamina for travelling
  day: number; // Days until election (starts at 30)
  scandal: number; // 0-100, impacts max polling
  electoralVotes: number;
  nationalPolling: number; // 0-100%
  states: StateData[];
  history: string[]; // Log of events
  gameOver: boolean;
  victory: boolean | null;
}

export interface StateData {
  id: string;
  name: string;
  name_zh: string;
  abbr: string;
  electoralVotes: number;
  polling: number; // 0-100% (Player favorability)
  locked: boolean; // Must visit unlocked states
  type: 'safe' | 'swing' | 'hostile';
  status: 'unvisited' | 'visited' | 'won' | 'lost';
  description: string;
}

export interface ScenarioOption {
  text: string;
  strategy: 'populist' | 'intellectual' | 'aggressive' | 'diplomatic' | 'corrupt';
}

export interface Scenario {
  title: string;
  description: string;
  options: ScenarioOption[];
}

export interface ScenarioResult {
  outcomeDescription: string;
  pollingChange: number; // e.g., +5 or -3
  fundChange: number;
  energyChange: number;
  scandalChange: number;
}

export type TacticType = 'none' | 'spin' | 'smear' | 'bribe';

export interface Tactic {
  type: TacticType;
  name: string;
  cost: number;
  description: string;
}
