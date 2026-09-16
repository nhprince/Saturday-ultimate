import React, { useMemo } from 'react';
import katex from 'katex';

interface LatexRendererProps {
  math: string;
  block?: boolean;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ math, block = false }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch (e: any) {
      return `<span class="text-rose-500 font-mono text-xs">[Math Render Error: ${e.message}]</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className="my-3 overflow-x-auto py-2 px-3 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-lg text-center font-serif text-sm border border-neutral-200/50 dark:border-neutral-800/50"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className="inline-block px-1 align-baseline text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
