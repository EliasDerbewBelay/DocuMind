export function extractHTMLText(): string {
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.content',
    '#content',
    '.post-body',
    '.article-body',
    'body',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const clone = el.cloneNode(true) as HTMLElement;
      const noise = clone.querySelectorAll(
        'nav, footer, script, style, iframe, .ads, [aria-hidden="true"]'
      );
      noise.forEach((n) => n.remove());
      const text = clone.innerText.trim();
      if (text.length > 200) return text;
    }
  }
  return document.body.innerText.trim();
}
