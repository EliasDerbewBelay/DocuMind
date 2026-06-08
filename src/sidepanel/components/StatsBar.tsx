import type { ExtractedDocument, DocumentSummary } from '../lib/types';

interface StatsBarProps {
  document: ExtractedDocument;
  summary?: DocumentSummary | null;
}

export default function StatsBar({ document, summary }: StatsBarProps) {
  const readTime =
    summary?.readingTimeMinutes ?? Math.max(1, Math.ceil(document.wordCount / 200));

  const stats = [
    {
      label: 'Pages',
      value: document.pageCount?.toString() ?? 'N/A',
    },
    {
      label: 'Read time',
      value: `${readTime} min`,
    },
    {
      label: 'Words',
      value: document.wordCount.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2 text-center"
        >
          <div className="text-base font-medium text-white">{stat.value}</div>
          <div className="text-[10px] text-text-muted mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
