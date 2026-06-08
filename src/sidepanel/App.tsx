import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ExtractedDocument, AppView, AppSettings } from './lib/types';
import { getSettings } from './lib/storage';
import { useSummary } from './hooks/useSummary';
import { useChat } from './hooks/useChat';
import LoadingScreen from './components/LoadingScreen';
import EmptyState from './components/EmptyState';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import StatsBar from './components/StatsBar';
import ChatThread from './components/ChatThread';
import ChatInput from './components/ChatInput';
import BookmarkPanel from './components/BookmarkPanel';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [view, setView] = useState<AppView>('empty');
  const [document, setDocument] = useState<ExtractedDocument | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'bookmarks'>('summary');
  const { summary, generate, reset: resetSummary } = useSummary();
  const { messages, isLoading, sendMessage, setMessages } = useChat(document, settings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [isScanning, setIsScanning] = useState(false);

  const handleDocumentReady = useCallback(
    async (doc: ExtractedDocument) => {
      setDocument(doc);
      setMessages([]);
      resetSummary();
      setActiveTab('summary');

      const s = settingsRef.current ?? (await getSettings());
      if (!settingsRef.current) setSettings(s);

      if (!s.apiKey) {
        setView('settings');
        return;
      }

      if (!s.autoSummarize) {
        setView('chat');
        return;
      }

      setView('loading');
      const result = await generate(doc, s.apiKey);
      setView(result ? 'summary' : 'chat');
    },
    [generate, resetSummary, setMessages]
  );

  const requestDocument = useCallback(
    (forceExtract = false) => {
      setIsScanning(true);

      const finish = (doc: ExtractedDocument | null | undefined) => {
        setIsScanning(false);
        if (doc) {
          handleDocumentReady(doc);
        } else {
          setView('empty');
        }
      };

      if (forceExtract) {
        chrome.runtime.sendMessage({ type: 'REQUEST_EXTRACTION' }, (res) => {
          finish(res?.document);
        });
        return;
      }

      chrome.runtime.sendMessage({ type: 'GET_CURRENT_DOCUMENT' }, (res) => {
        if (res?.document) {
          finish(res.document);
        } else {
          chrome.runtime.sendMessage({ type: 'REQUEST_EXTRACTION' }, (res2) => {
            finish(res2?.document);
          });
        }
      });
    },
    [handleDocumentReady]
  );

  useEffect(() => {
    getSettings().then(setSettings);
    requestDocument();

    const listener = (msg: { type: string; payload: ExtractedDocument }) => {
      if (msg.type === 'DOCUMENT_READY') handleDocumentReady(msg.payload);
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleDocumentReady, requestDocument]);

  const handleSettingsSave = (s: AppSettings) => {
    setSettings(s);
    if (document) {
      handleDocumentReady(document);
    } else {
      requestDocument(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-dark text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'loading' && (
          <LoadingScreen key="loading" documentTitle={document?.title} />
        )}
        {view === 'empty' && (
          <EmptyState
            key="empty"
            hasApiKey={!!settings?.apiKey}
            isScanning={isScanning}
            onOpenSettings={() => setView('settings')}
            onRescan={() => requestDocument(true)}
          />
        )}
        {(view === 'summary' || view === 'chat') && document && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <Header
              document={document}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenSettings={() => setView('settings')}
            />
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'summary' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <StatsBar document={document} summary={summary} />
                  {summary && (
                    <SummaryCard
                      summary={summary}
                      onAskMore={() => setActiveTab('chat')}
                    />
                  )}
                </div>
              )}
              {activeTab === 'chat' && (
                <>
                  <ChatThread
                    messages={messages}
                    document={document}
                    onExampleClick={sendMessage}
                  />
                  <ChatInput
                    isLoading={isLoading}
                    disabled={!settings?.apiKey}
                    onSend={sendMessage}
                  />
                </>
              )}
              {activeTab === 'bookmarks' && (
                <BookmarkPanel documentUrl={document.url} />
              )}
            </div>
          </motion.div>
        )}
        {view === 'settings' && (
          <SettingsPanel
            key="settings"
            onSave={handleSettingsSave}
            onBack={() => setView(document ? 'summary' : 'empty')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
