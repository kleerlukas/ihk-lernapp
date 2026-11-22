import { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);

const LABEL: Record<string, string> = { csharp: 'C#', sql: 'SQL', bash: 'Shell', text: 'Text' };

export function CodeBlock({ lang, src }: { lang: string; src: string }) {
  const html = useMemo(() => {
    try {
      return lang === 'text' ? null : hljs.highlight(src, { language: lang }).value;
    } catch {
      return null;
    }
  }, [lang, src]);
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
      <figcaption className="border-b border-stone-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:text-stone-400">
        {LABEL[lang] ?? lang}
      </figcaption>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[13px] leading-relaxed">
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{src}</code>}
      </pre>
    </figure>
  );
}

/** Inline-Code im Fließtext: `so` → <code> */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <span className={className} style={{ whiteSpace: 'pre-line' }}>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code key={i} className="rounded bg-stone-200/70 px-1 py-0.5 font-mono text-[0.92em] dark:bg-stone-800">
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
