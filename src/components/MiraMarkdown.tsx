/**
 * Markdown renderer for Mira assistant messages — safe subset, chat-friendly styles.
 */
import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components: Components = {
  p: ({ children }) => <p className="mb-2 leading-snug last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg border border-[var(--brutal-ink)]/20 bg-surface px-2 py-1.5 font-mono text-xs">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded border border-[var(--brutal-ink)]/15 bg-surface px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto last:mb-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-primary-soft pl-3 text-secondary last:mb-0">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => <p className="mb-1 text-base font-bold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 text-sm font-bold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 text-sm font-bold">{children}</p>,
  hr: () => <hr className="my-2 border-[var(--brutal-ink)]/20" />,
};

export interface MiraMarkdownProps {
  children: string;
  className?: string;
}

export function MiraMarkdown({ children, className = '' }: MiraMarkdownProps) {
  return (
    <div className={`mira-markdown min-w-0 break-words ${className}`.trim()}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}

export default MiraMarkdown;
