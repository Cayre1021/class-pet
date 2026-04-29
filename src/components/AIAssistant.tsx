import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Settings2, Save } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    provider: 'gemini',
    baseUrl: '',
    apiKey: '',
    model: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-3xl p-6 shadow-xl border-4 border-neutral-100"
            style={{ transformOrigin: 'bottom right' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-neutral-800 flex items-center gap-2">
                <Settings2 className="w-5 h-5" /> AI 模型配置
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-600 mb-1">供应商 (Provider)</label>
                <select 
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold text-neutral-700 outline-none focus:ring-2 ring-[var(--color-duo-blue)]"
                  value={config.provider}
                  onChange={(e) => setConfig({...config, provider: e.target.value})}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI / ChatGPT</option>
                  <option value="deepseek">Deepseek</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="other">自定义 (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-600 mb-1">API Key</label>
                <input 
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold text-neutral-700 outline-none focus:ring-2 ring-[var(--color-duo-blue)]"
                  placeholder="sk-..."
                />
              </div>

              {(config.provider === 'other' || config.provider === 'deepseek') && (
                <div>
                  <label className="block text-sm font-bold text-neutral-600 mb-1">Base URL</label>
                  <input 
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                    className="w-full bg-neutral-100 rounded-xl p-3 font-bold text-neutral-700 outline-none focus:ring-2 ring-[var(--color-duo-blue)]"
                    placeholder="https://api..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-neutral-600 mb-1">模型名称 (Model)</label>
                <input 
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({...config, model: e.target.value})}
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold text-neutral-700 outline-none focus:ring-2 ring-[var(--color-duo-blue)]"
                  placeholder={config.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  className="w-full bg-[var(--color-duo-green)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-green active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> 保存本地
                </button>
                <p className="text-xs text-neutral-400 mt-2 text-center font-bold">配置仅保存在本地浏览器</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer border-4 border-white"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
