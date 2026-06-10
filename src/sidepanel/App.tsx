import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ExtractedDocument, AppView, AppSettings } from './lib/types';
import { getSettings } from './lib/storage';
import { useSummary } from './hooks/useSummary';
import { useChat } from './hooks/useChat';
import { useFileUpload } from './hooks/useFileUpload';
import LoadingScreen from './components/LoadingScreen';
import EmptyState from './components/EmptyState';
import Header from './components/Header';
import SummaryPanel from './components/SummaryPanel';
import ChatThread from './components/ChatThread';
import ChatInput from './components/ChatInput';
import BookmarkPanel from './components/BookmarkPanel';
import SettingsPanel from './components/SettingsPanel';
import FileDropZone from './components/FileDropZone';

export default function App() {
  const [view, setView] = useState<AppView>('empty');
  const [document, setDocument] = useState<ExtractedDocument | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'bookmarks'>('chat');
  const [loadingTitle, setLoadingTitle] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const { summary, isLoading: isSummaryLoading, error: summaryError, generate, reset: resetSummary } =
    useSummary();
  const { messages, isLoading, sendMessage, setMessages } = useChat(document, settings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const openDocumentView = useCallback((doc: ExtractedDocument) => {
    setDocument(doc);
    setMessages([]);
    resetSummary();
    setActiveTab('chat');
    setView('chat');
  }, [resetSummary, setMessages]);

  const handleDocumentReady = useCallback(
    async (doc: ExtractedDocument) => {
      const s = settingsRef.current ?? (await getSettings());
      if (!settingsRef.current) setSettings(s);

      if (!s.apiKey) {
        setDocument(doc);
        setView('settings');
        return;
      }

      if (s.autoSummarize) {
        setDocument(doc);
        setMessages([]);
        resetSummary();
        setActiveTab('summary');
        setLoadingTitle(doc.title);
        setView('loading');
        const result = await generate(doc, s.apiKey);
        setView(result ? 'summary' : 'chat');
        if (!result) setActiveTab('chat');
        return;
      }

      openDocumentView(doc);
    },
    [generate, resetSummary, setMessages, openDocumentView]
  );

  const handleGenerateSummary = useCallback(async () => {
    if (!document || !settings?.apiKey || isSummaryLoading) return;
    setLoadingTitle(document.title);
    setView('loading');
    const result = await generate(document, settings.apiKey);
    setActiveTab('summary');
    setView(result ? 'summary' : 'chat');
  }, [document, settings?.apiKey, isSummaryLoading, generate]);

  const {
    isReading: isReadingFile,
    error: fileError,
    fileInputRef,
    openFilePicker,
    handleInputChange,
    handleDrop,
    handleDragOver,
    clearError,
  } = useFileUpload({
    onDocumentReady: handleDocumentReady,
    onReadingStart: (fileName) => {
      setLoadingTitle(fileName.replace(/\.[^.]+$/, '') || fileName);
      setView('loading');
      clearError();
    },
    onError: () => setView('empty'),
  });

  const requestDocument = useCallback(
    (forceExtract = false) => {
      setIsScanning(true);

      const finish = (doc: ExtractedDocument | null | undefined) => {
        setIsScanning(false);
        if (doc) {
          handleDocumentReady(doc);
        } else if (!isReadingFile) {
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
    [handleDocumentReady, isReadingFile]
  );

  useEffect(() => {
    getSettings().then(setSettings);
    requestDocument();

    const listener = (msg: { type: string; payload: ExtractedDocument }) => {
      if (msg.type === 'DOCUMENT_READY' && msg.payload.source === 'tab') {
        handleDocumentReady(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleDocumentReady, requestDocument]);

  const handleSettingsSave = (s: AppSettings) => {
    setSettings(s);
    if (document && s.apiKey) {
      setView('chat');
      setActiveTab('chat');
    } else if (!document && s.apiKey) {
      setView('empty');
      requestDocument(true);
    } else if (!s.apiKey) {
      setView('empty');
    }
  };

  const showAiLoading = view === 'loading' && isSummaryLoading;

  return (
    <div
      className="flex flex-col h-screen bg-brand-dark text-white overflow-hidden"
      onDrop={view === 'empty' ? undefined : handleDrop}
      onDragOver={view === 'empty' ? undefined : handleDragOver}
    >
      <FileDropZone
        fileInputRef={fileInputRef}
        onInputChange={handleInputChange}
        onOpenPicker={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        compact
      />

      <AnimatePresence mode="wait">
        {showAiLoading && (
          <LoadingScreen
            key="loading"
            documentTitle={loadingTitle ?? document?.title}
          />
        )}
        {(view === 'loading' && isReadingFile) && (
          <LoadingScreen
            key="file-loading"
            documentTitle={loadingTitle}
          />
        )}
        {view === 'empty' && (
          <EmptyState
            key="empty"
            hasApiKey={!!settings?.apiKey}
            isScanning={isScanning}
            isReadingFile={isReadingFile}
            fileError={fileError}
            fileInputRef={fileInputRef}
            onOpenSettings={() => setView('settings')}
            onRescan={() => requestDocument(true)}
            onOpenFilePicker={openFilePicker}
            onFileInputChange={handleInputChange}
            onFileDrop={handleDrop}
            onFileDragOver={handleDragOver}
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
              onOpenFilePicker={openFilePicker}
            />
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'summary' && (
                <SummaryPanel
                  document={document}
                  summary={summary}
                  isGenerating={isSummaryLoading}
                  error={summaryError}
                  onGenerate={handleGenerateSummary}
                  onAskMore={() => setActiveTab('chat')}
                />
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
            onBack={() => {
              if (document) {
                setView('chat');
                setActiveTab('chat');
              } else {
                setView('empty');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
