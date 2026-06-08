import { useState, useEffect, useCallback } from 'react';
import type { Bookmark } from '../lib/types';
import { getBookmarks, addBookmark, deleteBookmark } from '../lib/storage';

export function useBookmarks(documentUrl: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!documentUrl) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const items = await getBookmarks(documentUrl);
    setBookmarks(items);
    setIsLoading(false);
  }, [documentUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (note: string, excerpt: string) => {
      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        documentUrl,
        note,
        excerpt,
        createdAt: Date.now(),
      };
      await addBookmark(bookmark);
      await refresh();
    },
    [documentUrl, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteBookmark(id);
      await refresh();
    },
    [refresh]
  );

  return { bookmarks, isLoading, create, remove, refresh };
}
