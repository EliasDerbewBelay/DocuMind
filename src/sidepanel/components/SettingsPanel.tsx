import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import type { AppSettings } from '../lib/types';
import { getSettings, saveSettings } from '../lib/storage';
import { validateApiKey, isValidGeminiKey } from '../lib/gemini';

interface SettingsPanelProps {
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

function maskApiKey(key: string): string {
  if (key.length <= 10) return '••••••••';
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

export default function SettingsPanel({ onSave, onBack }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '',
    language: 'en',
    autoSummarize: false,
    highlightEnabled: true,
  });
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setSavedKey(s.apiKey);
      setIsLoading(false);
    });
    return () => clearTimeout(successTimer.current);
  }, []);

  const apiKeyChanged = settings.apiKey.trim() !== savedKey;
  const hasKey = savedKey.length > 0;

  const showSuccess = (message: string) => {
    setSuccess(message);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 4000);
  };

  const validateKeyFormat = (key: string): string | null => {
    if (!isValidGeminiKey(key)) {
      return 'Gemini keys start with AIza or AQ. (get one free at aistudio.google.com/apikey)';
    }
    return null;
  };

  const handleTestKey = async () => {
    const key = settings.apiKey.trim();
    if (!key) {
      setError('Enter an API key first');
      return;
    }
    const formatError = validateKeyFormat(key);
    if (formatError) {
      setError(formatError);
      return;
    }

    setIsTesting(true);
    setError('');
    setSuccess('');

    const result = await validateApiKey(key);
    setIsTesting(false);

    if (result.ok) {
      showSuccess('Gemini API key is valid and working.');
    } else {
      setError(result.error);
    }
  };

  const handleClearKey = async () => {
    const cleared = { ...settings, apiKey: '' };
    setSettings(cleared);
    setSavedKey('');
    await saveSettings(cleared);
    showSuccess('API key removed.');
    onSave(cleared);
  };

  const handleSave = async () => {
    const key = settings.apiKey.trim();
    setError('');
    setSuccess('');

    if (!key && !hasKey) {
      setError('Add your Gemini API key to use DocuMind.');
      return;
    }

    const finalSettings: AppSettings = {
      ...settings,
      apiKey: key || savedKey,
    };

    if (apiKeyChanged && key) {
      const formatError = validateKeyFormat(key);
      if (formatError) {
        setError(formatError);
        return;
      }

      setIsSaving(true);
      const result = await validateApiKey(key);
      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    await saveSettings(finalSettings);
    setSavedKey(finalSettings.apiKey);
    setSettings(finalSettings);
    showSuccess('Settings saved.');
    onSave(finalSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3 border-b border-white/[0.06] flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display text-lg">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={16} className="text-accent" />
            <h3 className="text-sm font-medium text-text-primary">Google Gemini API Key</h3>
          </div>

          <div
            className={`flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg text-xs ${
              hasKey
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {hasKey ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>
              {hasKey
                ? `Key saved: ${maskApiKey(savedKey)}`
                : 'No API key configured'}
            </span>
          </div>

          <p className="text-xs text-text-muted mb-3 leading-relaxed">
            Stored locally in Chrome. Used only to call Google Gemini when you
            summarize or chat. Free tier available at Google AI Studio.
          </p>

          <label className="block text-[10px] text-text-muted uppercase tracking-wide mb-1.5">
            {apiKeyChanged ? 'New API key' : 'Change API key'}
          </label>
          <div className="relative mb-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => {
                setSettings({ ...settings, apiKey: e.target.value });
                setError('');
              }}
              placeholder={hasKey ? 'Paste a new key to replace current' : 'AIza... or AQ....'}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 font-mono"
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

          <div className="flex gap-2 mb-2">
            <button
              onClick={handleTestKey}
              disabled={isTesting || !settings.apiKey.trim()}
              className="flex-1 py-2 text-xs border border-white/[0.08] rounded-lg text-text-secondary hover:text-white hover:border-accent/30 transition-colors disabled:opacity-40"
            >
              {isTesting ? 'Testing...' : 'Test connection'}
            </button>
            {hasKey && (
              <button
                onClick={handleClearKey}
                className="px-3 py-2 text-xs border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                title="Remove saved API key"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-accent hover:text-white transition-colors"
          >
            Get your free API key at aistudio.google.com →
          </a>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400 mt-3 leading-relaxed"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-green-400 mt-3"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h3 className="text-sm font-medium text-text-primary mb-3">Preferences</h3>
          <div className="space-y-3 bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <span className="text-sm text-text-secondary">
                Auto-summarize on open (uses API quota)
              </span>
              <input
                type="checkbox"
                checked={settings.autoSummarize}
                onChange={(e) =>
                  setSettings({ ...settings, autoSummarize: e.target.checked })
                }
                className="w-4 h-4 accent-accent rounded flex-shrink-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <span className="text-sm text-text-secondary">Enable document highlights</span>
              <input
                type="checkbox"
                checked={settings.highlightEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, highlightEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-accent rounded flex-shrink-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-4">
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

      <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Verifying & saving...' : 'Save settings'}
        </button>
        <p className="text-[10px] text-text-muted text-center mt-2">
          {apiKeyChanged
            ? 'Your new Gemini key will be verified before saving.'
            : 'Preference changes save without re-verifying your key.'}
        </p>
      </div>
    </motion.div>
  );
}
