import React from 'react';
import { Calendar, Lightbulb, PenTool, Code2, Sparkles, Binary } from 'lucide-react';
import { AdminCMSConfig } from '../../types';

interface LandingWelcomeProps {
  cmsConfig?: AdminCMSConfig;
  onSelectPrompt: (prompt: string) => void;
}

export const LandingWelcome: React.FC<LandingWelcomeProps> = ({ cmsConfig, onSelectPrompt }) => {
  const suggestions = cmsConfig?.promptSuggestions || [
    {
      id: 'sug-1',
      title: 'Help me plan my week',
      prompt: 'Help me plan an intentional, calm, and productive week balancing focused engineering and personal well-being.',
      category: 'productivity',
    },
    {
      id: 'sug-2',
      title: 'Explain something difficult',
      prompt: 'Explain how attention mechanisms in transformer neural networks operate using an intuitive analogy and LaTeX equations for query, key, and value matrices.',
      category: 'reasoning',
    },
    {
      id: 'sug-3',
      title: 'Write something for me',
      prompt: 'Draft an elegant, understated release announcement for our minimalist AI companion, Saturday.',
      category: 'writing',
    },
    {
      id: 'sug-4',
      title: 'Help me build an idea',
      prompt: 'Architect a low-latency, zero-cost edge routing pipeline for LLMs that guarantees 99.9% uptime with intelligent fallback.',
      category: 'coding',
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <Calendar className="w-3.5 h-3.5 text-neutral-500" />;
      case 'reasoning': return <Binary className="w-3.5 h-3.5 text-purple-500" />;
      case 'writing': return <PenTool className="w-3.5 h-3.5 text-amber-500" />;
      case 'coding': return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Lightbulb className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto text-center animate-fade-in">
      {/* Brand Title */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-6">
        <Sparkles className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
        <span>Calm · Intelligent · Editorial AI</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-3">
        {cmsConfig?.welcomeHeadline || 'Saturday'}
      </h1>

      <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 font-light max-w-md mx-auto mb-10 leading-relaxed">
        {cmsConfig?.welcomeSubheadline || 'What are we working on today?'}
      </p>

      {/* Suggestion Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
        {suggestions.map(s => (
          <button
            key={s.id}
            onClick={() => onSelectPrompt(s.prompt)}
            className="group flex flex-col p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-[#141417]/70 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-xs shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center space-x-2 mb-1.5">
              {getCategoryIcon(s.category)}
              <span className="font-semibold text-neutral-900 dark:text-white group-hover:text-neutral-950 dark:group-hover:text-white">
                {s.title}
              </span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed text-[11.5px]">
              {s.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
