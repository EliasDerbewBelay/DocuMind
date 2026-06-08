export function extractGoogleDocText(): string {
  const selectors = [
    '.kix-appview-editor',
    '.docs-editor-container',
    '[role="textbox"]',
    '.kix-page-content-wrapper',
    '.kix-rotatingtilemanager',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = (el as HTMLElement).innerText.trim();
      if (text.length > 100) return text;
    }
  }

  const blocks = document.querySelectorAll(
    '.kix-lineview-text-block, .kix-wordhtmlgenerator-word-block, .kix-paragraphrenderer'
  );
  if (blocks.length > 0) {
    const text = Array.from(blocks)
      .map((b) => (b as HTMLElement).innerText)
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text.length > 100) return text;
  }

  const ariaDoc = document.querySelector('[role="document"]');
  if (ariaDoc) {
    const text = (ariaDoc as HTMLElement).innerText.trim();
    if (text.length > 100) return text;
  }

  return '';
}
