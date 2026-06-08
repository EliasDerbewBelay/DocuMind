import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { AppSettings } from '../lib/types';
import { getSettings, saveSettings } from '../lib/storage';
import { validateApiKey } from '../lib/claude';

interface SettingsPanelProps {
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

export default function SettingsPanel({ onSave, onBack }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '',
    language: 'en',
    autoSummarize: true,
    highlightEnabled: true,
  });
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    const key = settings.apiKey.trim();
    if (!key) {
      setError('API key is required');
      return;
    }
    if (!key.startsWith('sk-ant-')) {
      setError('API key must start with sk-ant- (e.g. sk-ant-api03-...)');
      return;
    }

    setIsSaving(true);
    setError('');

    const result = await validateApiKey(key);
    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    await saveSettings({ ...settings, apiKey: key });
    setIsSaving(false);
    onSave({ ...settings, apiKey: key });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full overflow-y-auto"
    >
      <div className="flex items-center gap-2 p-3 border-b border-white/[0.06]">
        <button
          onClick={onBack}
          className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display text-lg">Settings</h2>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <section>
          <h3 className="text-sm font-medium text-text-primary mb-1">API Key</h3>
          <p className="text-xs text-text-muted mb-3 leading-relaxed">
            Your API key is stored locally and only used to talk to Claude. It never
            leaves your device.
          </p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-ant-api03-..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-white"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-accent hover:text-white transition-colors"
          >
            Get your API key at console.anthropic.com →
          </a>
          <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
            Your account needs credits to work. Add funds at console.anthropic.com → Billing
            (evaluation accounts start at $0.00).
          </p>
          {error && <p className="text-xs text-red-400 mt-2 leading-relaxed">{error}</p>}
        </section>

        <section>
          <h3 className="text-sm font-medium text-text-primary mb-3">Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-secondary">Auto-summarize on document open</span>
              <input
                type="checkbox"
                checked={settings.autoSummarize}
                onChange={(e) =>
                  setSettings({ ...settings, autoSummarize: e.target.checked })
                }
                className="w-4 h-4 accent-accent rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-secondary">Enable document highlights</span>
              <input
                type="checkbox"
                checked={settings.highlightEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, highlightEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-accent rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-secondary">UI Language</span>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    language: e.target.value as 'en' | 'am',
                  })
                }
                className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1 text-sm text-text-primary"
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Verifying API key...' : 'Save settings'}
        </button>
      </div>
    </motion.div>
  );
}
