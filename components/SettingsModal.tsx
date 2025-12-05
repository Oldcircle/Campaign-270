
import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../types';
import { PROVIDERS, TEXT } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfigId: string;
  onConfigChange: (config: AIConfig) => void;
  language: 'en' | 'zh';
}

const DEFAULT_CONFIG: AIConfig = {
  id: 'default',
  name: 'Default (Gemini)',
  provider: 'google',
  apiKey: process.env.API_KEY || '',
  modelName: 'gemini-2.5-flash',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, currentConfigId, onConfigChange, language 
}) => {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>(currentConfigId);
  const [editingConfig, setEditingConfig] = useState<AIConfig>(DEFAULT_CONFIG);

  const t = TEXT[language];

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem('ai_configs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfigs(parsed);
      // If we have saved configs, find the current one
      if (currentConfigId) {
          const found = parsed.find((c: AIConfig) => c.id === currentConfigId);
          if (found) setEditingConfig(found);
      }
    } else {
      // Initialize with default
      setConfigs([DEFAULT_CONFIG]);
      setEditingConfig(DEFAULT_CONFIG);
    }
  }, [isOpen]);

  const handleSelectConfig = (config: AIConfig) => {
    setSelectedConfigId(config.id);
    setEditingConfig({ ...config });
  };

  const handleAddNew = () => {
    const newConfig: AIConfig = {
      id: Date.now().toString(),
      name: 'New Config',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      modelName: 'gpt-4o-mini'
    };
    setConfigs([...configs, newConfig]);
    handleSelectConfig(newConfig);
  };

  const handleSave = () => {
    // Update the list
    const updatedConfigs = configs.map(c => c.id === editingConfig.id ? editingConfig : c);
    setConfigs(updatedConfigs);
    localStorage.setItem('ai_configs', JSON.stringify(updatedConfigs));
    
    // Apply changes
    onConfigChange(editingConfig);
    onClose();
  };

  const handleChange = (field: keyof AIConfig, value: string) => {
    setEditingConfig(prev => {
        const updated = { ...prev, [field]: value };
        // Auto-fill default URL if provider changes and url is empty or was default
        if (field === 'provider') {
            const provData = PROVIDERS.find(p => p.value === value);
            if (provData) {
                updated.baseUrl = provData.defaultUrl || '';
                updated.modelName = provData.defaultModel;
            }
        }
        return updated;
    });
  };

  const providerData = PROVIDERS.find(p => p.value === editingConfig.provider);
  const isOllama = editingConfig.provider === 'ollama';
  const isBrowserRestricted = ['openai', 'deepseek', 'grok', 'claude'].includes(editingConfig.provider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 bg-slate-100 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700">{t.settings}</h3>
            <button 
                onClick={handleAddNew}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
            >
                +
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {configs.map(config => (
              <button
                key={config.id}
                onClick={() => handleSelectConfig(config)}
                className={`w-full text-left p-3 rounded-lg transition-all border-l-4 ${
                  selectedConfigId === config.id 
                    ? 'bg-white border-blue-600 shadow-sm' 
                    : 'border-transparent hover:bg-slate-200 text-slate-500'
                }`}
              >
                <div className="font-bold text-slate-800 truncate">{config.name}</div>
                <div className="text-xs text-slate-400 capitalize">{config.provider}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 bg-white p-8 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center text-slate-800">
                 ⚙️ {t.configure}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
          </div>
          
          <div className="space-y-6 flex-1">
             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Config Name</label>
                <input 
                    type="text" 
                    value={editingConfig.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                />
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Provider</label>
                <select 
                    value={editingConfig.provider}
                    onChange={(e) => handleChange('provider', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                >
                    {PROVIDERS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
                {isBrowserRestricted && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">
                        ⚠️ <b>Browser Warning:</b> Direct API calls to {providerData?.label} are usually blocked by CORS in browsers. 
                        <br/>Recommended: Use <b>OpenRouter</b> or <b>Google Gemini</b> instead.
                    </p>
                )}
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">API Key</label>
                <input 
                    type="password" 
                    value={editingConfig.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    placeholder={editingConfig.provider === 'ollama' ? "Not required for Ollama" : "sk-..."}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">Stored locally in your browser.</p>
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">API Base URL</label>
                <input 
                    type="text" 
                    value={editingConfig.baseUrl || ''}
                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                    placeholder={providerData?.defaultUrl || "https://..."}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900 placeholder:text-slate-300"
                />
                {isOllama && (
                    <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ For Localhost: Ensure your Ollama server is running with <code>OLLAMA_ORIGINS="*"</code> to allow browser requests.
                    </p>
                )}
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Model Name</label>
                <input 
                    type="text" 
                    value={editingConfig.modelName}
                    onChange={(e) => handleChange('modelName', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900"
                />
             </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                  {t.cancel}
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-bold flex items-center"
              >
                  💾 {t.save}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};
