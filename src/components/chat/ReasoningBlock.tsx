import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ReasoningBlockProps {
  reasoning: string;
  isStreaming?: boolean;
}

export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({ reasoning, isStreaming = false }) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  if (!reasoning && !isStreaming) return null;

  return (
    <div className="mb-3 rounded-xl border border-purple-200/60 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 overflow-hidden text-xs transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-purple-900 dark:text-purple-300 hover:bg-purple-100/40 dark:hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Brain className={`w-3.5 h-3.5 ${isStreaming ? 'animate-pulse text-purple-600 dark:text-purple-400' : 'text-purple-500'}`} />
          <span className="font-medium">
            {isStreaming ? 'Deliberating step-by-step reasoning...' : 'Reasoning Process'}
          </span>
          {isStreaming && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
          )}
        </div>

        <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
          <span className="text-[10px] uppercase font-mono">{isOpen ? 'Hide' : 'Inspect'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 pt-1 border-t border-purple-200/40 dark:border-purple-900/30 font-mono text-[12px] leading-relaxed text-purple-950/80 dark:text-purple-200/80 whitespace-pre-wrap select-text bg-white/40 dark:bg-black/20">
          {reasoning}
          {isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-purple-500 animate-pulse align-middle" />}
        </div>
      )}
    </div>
  );
};
