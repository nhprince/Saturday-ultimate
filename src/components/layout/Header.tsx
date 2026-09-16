import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Zap,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Share2,
  Trash2,
  Plus,
  Check,
  Pencil
} from 'lucide-react';
import { Conversation, AIModel } from '../../types';

interface HeaderProps {
  currentConversation?: Conversation;
  onToggleMobileMenu: () => void;
  selectedModelId: string;
  onOpenModelSelector: () => void;
  onOpenSearch: () => void;
  onNewChat: () => void;
  onRenameConversation?: (title: string) => void;
  onDeleteConversation?: () => void;
  availableModels: AIModel[];
}

export const Header: React.FC<HeaderProps> = ({
  currentConversation,
  onToggleMobileMenu,
  selectedModelId,
  onOpenModelSelector,
  onOpenSearch,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  availableModels,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(currentConversation?.title || 'New Chat');

  const modelInfo = availableModels.find(m => m.id === selectedModelId);
  const modelLabel =
    selectedModelId === 'smart-router'
      ? 'Smart Router'
      : selectedModelId === 'free-router'
      ? 'Free Router'
      : modelInfo?.displayName || selectedModelId.split('/').pop() || 'Model';

  const handleSaveTitle = () => {
    if (titleText.trim() && onRenameConversation) {
      onRenameConversation(titleText.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-neutral-200/60 dark:border-neutral-800/60 liquid-glass flex items-center justify-between px-3 sm:px-6 z-10 select-none">
      {/* Left: Mobile Toggle & Conversation Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isEditingTitle ? (
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={titleText}
              onChange={e => setTitleText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 rounded text-emerald-600 hover:bg-neutral-100"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTitleText(currentConversation?.title || 'New Chat');
              setIsEditingTitle(true);
            }}
            className="group flex items-center space-x-1.5 cursor-pointer min-w-0"
            title="Click to rename conversation"
          >
            <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-neutral-900 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {currentConversation?.title || 'New Conversation'}
            </h2>
            <Pencil className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Center / Right: Model Selector Pill & Quick Utilities */}
      <div className="flex items-center space-x-2">
        {/* Model Selector Pill */}
        <button
          onClick={onOpenModelSelector}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-sm"
        >
          {selectedModelId === 'smart-router' ? (
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          ) : selectedModelId === 'free-router' ? (
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          )}
          <span className="truncate max-w-[120px] sm:max-w-[170px]">{modelLabel}</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        {/* Global Search Shortcut */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hidden sm:flex"
          title="Search conversations (Cmd+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* New Chat quick button */}
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
