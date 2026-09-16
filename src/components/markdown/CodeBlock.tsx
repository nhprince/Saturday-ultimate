import React, { useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', code, filename }) => {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const lines = code.trim().split('\n');

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-[#141417] text-neutral-200 shadow-sm transition-all duration-200">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1b1b20] border-b border-neutral-800 text-xs text-neutral-400 select-none">
        <div className="flex items-center space-x-2">
          <Code2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-mono uppercase tracking-wider text-[11px] font-medium text-neutral-300">
            {filename || language || 'code'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="text-[10px] px-1.5 py-0.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Toggle line numbers"
          >
            {showLineNumbers ? 'Hide #s' : '#s'}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all text-xs"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto p-3.5 text-[13px] leading-relaxed font-mono">
        <pre className="flex">
          {showLineNumbers && (
            <div className="pr-3 select-none text-neutral-600 text-right font-mono text-[12px] border-r border-neutral-800/80 mr-3">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code className="text-neutral-200 whitespace-pre">
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  );
};
