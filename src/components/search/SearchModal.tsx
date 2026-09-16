import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, ArrowRight, X, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { formatTimeAgo } from '../../lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectConversation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Global hotkey escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161619] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#19191d]/50">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search conversations, ideas, or message contents..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-3.5 bg-transparent border-0 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {loading && (
            <div className="py-6 text-center text-xs text-neutral-400">Searching...</div>
          )}

          {!loading && results.length > 0 && (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectConversation(item.conversationId);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-start justify-between group"
              >
                <div className="flex items-start space-x-3 pr-2">
                  <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-neutral-900 dark:text-white group-hover:underline">
                      {item.conversationTitle}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-neutral-400 text-[10px] shrink-0 font-mono">
                  <span>{formatTimeAgo(item.timestamp)}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching messages found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div className="py-6 text-center text-xs text-neutral-400">
              Type to search all past conversations across Saturday.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-[#18181c] border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Navigate with mouse or tap</span>
          <span className="font-mono text-[10px]">Esc to close</span>
        </div>
      </div>
    </div>
  );
};
