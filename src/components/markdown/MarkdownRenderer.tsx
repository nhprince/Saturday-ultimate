import React, { useMemo } from 'react';
import { marked } from 'marked';
import { CodeBlock } from './CodeBlock';
import { LatexRenderer } from './LatexRenderer';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Extract and process content chunks (code blocks, latex, and standard markdown)
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Pattern to split block math ($$...$$) and code blocks (```...```)
    const segments: Array<{ type: 'markdown' | 'code' | 'block-math'; raw: string; lang?: string }> = [];
    
    // We regex split while retaining delimiters
    const codeAndMathRegex = /(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g;
    let lastIndex = 0;
    let match;

    while ((match = codeAndMathRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'markdown',
          raw: content.substring(lastIndex, match.index),
        });
      }

      const matchedText = match[0];
      if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
        segments.push({
          type: 'block-math',
          raw: matchedText.slice(2, -2),
        });
      } else if (matchedText.startsWith('```')) {
        const firstLineEnd = matchedText.indexOf('\n');
        const lang = firstLineEnd !== -1 ? matchedText.slice(3, firstLineEnd).trim() : '';
        const code = firstLineEnd !== -1 ? matchedText.slice(firstLineEnd + 1, -3) : matchedText.slice(3, -3);
        segments.push({
          type: 'code',
          raw: code,
          lang,
        });
      }

      lastIndex = match.index + matchedText.length;
    }

    if (lastIndex < content.length) {
      segments.push({
        type: 'markdown',
        raw: content.substring(lastIndex),
      });
    }

    return segments.map((seg, idx) => {
      if (seg.type === 'code') {
        return <CodeBlock key={idx} language={seg.lang} code={seg.raw} />;
      }

      if (seg.type === 'block-math') {
        return <LatexRenderer key={idx} math={seg.raw} block={true} />;
      }

      // Handle inline math within markdown: $...$
      // We will parse inline math before converting markdown to HTML
      const inlineMathRegex = /\$([^\$\n]+)\$/g;
      let textWithMathPlaceholders = seg.raw;
      const mathMap: Record<string, string> = {};
      let mIdx = 0;

      textWithMathPlaceholders = textWithMathPlaceholders.replace(inlineMathRegex, (_, mathExpr) => {
        const placeholder = `__MATH_PH_${mIdx}__`;
        mathMap[placeholder] = mathExpr;
        mIdx++;
        return placeholder;
      });

      // Render markdown using marked
      let html = marked.parse(textWithMathPlaceholders, { breaks: true, gfm: true }) as string;

      // Replace back math placeholders with rendered KaTeX spans
      for (const [placeholder, mathExpr] of Object.entries(mathMap)) {
        try {
          const katexHtml = (window as any).katex
            ? (window as any).katex.renderToString(mathExpr, { displayMode: false, throwOnError: false })
            : `<span class="italic font-serif">${mathExpr}</span>`;
          html = html.replace(placeholder, `<span class="inline-math">${katexHtml}</span>`);
        } catch {
          html = html.replace(placeholder, `$${mathExpr}$`);
        }
      }

      return (
        <div
          key={idx}
          className="markdown-body text-neutral-800 dark:text-neutral-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [content]);

  return <div className="space-y-1">{renderedElements}</div>;
};
