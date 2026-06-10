import { motion } from 'framer-motion';
import { Settings, FolderOpen } from 'lucide-react';
import type { ExtractedDocument } from '../lib/types';

interface HeaderProps {
  document: ExtractedDocument;
  activeTab: 'summary' | 'chat' | 'bookmarks';
  onTabChange: (tab: 'summary' | 'chat' | 'bookmarks') => void;
  onOpenSettings: () => void;
  onOpenFilePicker: () => void;
}

const tabs = [
  { id: 'summary' as const, label: 'Summary' },
  { id: 'chat' as const, label: 'Chat' },
  { id: 'bookmarks' as const, label: 'Bookmarks' },
];

export default function Header({
  document,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenFilePicker,
}: HeaderProps) {
  return (
    <header className="flex-shrink-0 bg-brand-dark border-b border-white/[0.06] px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
            DM
          </div>
          <span className="text-sm font-medium text-text-primary truncate">DocuMind</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onOpenFilePicker}
            className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            aria-label="Open file from computer"
            title="Open file from computer"
          >
            <FolderOpen size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-text-muted truncate mb-2" title={document.title}>
        {document.source === 'disk' && document.fileName
          ? `${document.title} (local file)`
          : document.title}
      </p>

      <nav className="flex gap-1 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-accent'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-accent/20 border border-accent/30 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
