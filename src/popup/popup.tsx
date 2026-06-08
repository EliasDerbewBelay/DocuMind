import { PanelRightOpen } from 'lucide-react';

export default function Popup() {
  const openPanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  return (
    <div
      style={{
        width: 280,
        padding: 16,
        fontFamily: '"DM Sans", sans-serif',
        background: '#0D0F1A',
        color: '#F0F0F5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#6C63FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          DM
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>DocuMind</span>
      </div>

      <button
        onClick={openPanel}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 16px',
          background: '#6C63FF',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <PanelRightOpen size={16} />
        Open Panel
      </button>

      <p
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 11,
          color: '#5C5B72',
        }}
      >
        Open a document, then chat with it in the side panel.
      </p>
    </div>
  );
}
