import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';

interface BookmarkPanelProps {
  documentUrl: string;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function BookmarkPanel({ documentUrl }: BookmarkPanelProps) {
  const { bookmarks, create, remove } = useBookmarks(documentUrl);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');

  const handleAdd = async () => {
    if (!note.trim()) return;
    await create(note.trim(), note.trim().slice(0, 120));
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-text-muted">Saved bookmarks</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors"
          aria-label="Add bookmark"
        >
          <Plus size={16} />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-transparent border border-white/[0.06] rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={!note.trim()}
                className="w-full py-1.5 text-xs bg-accent text-white rounded-lg disabled:opacity-40"
              >
                Save bookmark
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Bookmark size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
          <p className="text-sm">No bookmarks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bm) => (
            <motion.div
              key={bm.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3 group"
            >
              <p className="text-xs text-text-muted line-clamp-2 mb-1">{bm.excerpt}</p>
              <p className="text-sm text-text-primary mb-2">{bm.note}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">
                  {formatRelativeTime(bm.createdAt)}
                </span>
                <button
                  onClick={() => remove(bm.id)}
                  className="p-1 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete bookmark"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
