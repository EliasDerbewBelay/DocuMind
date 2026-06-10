import type { AppSettings, Bookmark } from './types';

const SETTINGS_KEY = 'documind_settings';
const BOOKMARKS_KEY = 'documind_bookmarks';

const defaultSettings: AppSettings = {
  apiKey: '',
  language: 'en',
  autoSummarize: false,
  highlightEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...defaultSettings, ...result[SETTINGS_KEY] };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function getBookmarks(documentUrl: string): Promise<Bookmark[]> {
  const result = await chrome.storage.local.get(BOOKMARKS_KEY);
  const all: Bookmark[] = result[BOOKMARKS_KEY] || [];
  return all.filter((b) => b.documentUrl === documentUrl);
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const result = await chrome.storage.local.get(BOOKMARKS_KEY);
  const all: Bookmark[] = result[BOOKMARKS_KEY] || [];
  all.push(bookmark);
  await chrome.storage.local.set({ [BOOKMARKS_KEY]: all });
}

export async function deleteBookmark(id: string): Promise<void> {
  const result = await chrome.storage.local.get(BOOKMARKS_KEY);
  const all: Bookmark[] = result[BOOKMARKS_KEY] || [];
  await chrome.storage.local.set({
    [BOOKMARKS_KEY]: all.filter((b) => b.id !== id),
  });
}
