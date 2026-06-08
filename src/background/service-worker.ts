import type { ExtractedDocument } from '../sidepanel/lib/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: true });
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

const tabDocuments = new Map<number, ExtractedDocument>();

function getContentScriptFile(): string | undefined {
  const scripts = chrome.runtime.getManifest().content_scripts;
  return scripts?.[0]?.js?.[0];
}

async function requestExtractionFromTab(
  tabId: number
): Promise<ExtractedDocument | null> {
  const trySendMessage = (): Promise<ExtractedDocument | null> =>
    new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: 'REQUEST_EXTRACTION' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response?.payload ?? null);
      });
    });

  let payload = await trySendMessage();

  if (!payload) {
    const scriptFile = getContentScriptFile();
    if (scriptFile) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [scriptFile],
        });
        await new Promise((r) => setTimeout(r, 1500));
        payload = await trySendMessage();
      } catch {
        // Tab may not allow injection (chrome://, etc.)
      }
    }
  }

  if (payload) {
    tabDocuments.set(tabId, payload);
    chrome.runtime
      .sendMessage({ type: 'DOCUMENT_READY', payload })
      .catch(() => {});
  }

  return payload;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOCUMENT_EXTRACTED' && sender.tab?.id) {
    tabDocuments.set(sender.tab.id, message.payload);
    chrome.runtime
      .sendMessage({
        type: 'DOCUMENT_READY',
        payload: message.payload,
      })
      .catch(() => {});
    return;
  }

  if (message.type === 'GET_CURRENT_DOCUMENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const doc = tabs[0]?.id ? tabDocuments.get(tabs[0].id) : null;
      sendResponse({ document: doc });
    });
    return true;
  }

  if (message.type === 'REQUEST_EXTRACTION') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({ document: null });
        return;
      }

      const cached = tabDocuments.get(tabId);
      if (cached) {
        sendResponse({ document: cached });
        return;
      }

      const doc = await requestExtractionFromTab(tabId);
      sendResponse({ document: doc });
    });
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL' && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    sendResponse({ success: true });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabDocuments.delete(tabId);
});
