import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Settings,
  Shield,
  Sun,
  Moon,
  MoreVertical,
  Check,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Archive,
  Share2
} from 'lucide-react';
import { Conversation, UserSettings, ThemeMode } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onDeleteConversation: (id: string) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSearch,
  onOpenSettings,
  onOpenAdmin,
  onUpdateConversation,
  onDeleteConversation,
  settings,
  onUpdateSettings,
  collapsed,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onUpdateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  // Group conversations
  const pinnedList = conversations.filter(c => c.pinned && !c.archived);
  const unpinnedList = conversations.filter(c => !c.pinned && !c.archived);

  return (
    <aside
      className={`h-full flex flex-col liquid-glass border-r transition-all duration-300 z-20 select-none ${
        collapsed && !isMobile ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div
          onClick={onNewChat}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs tracking-tight shadow-sm group-hover:scale-105 transition-transform">
            S
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white leading-none">
                Saturday
              </span>
              <span className="text-[10px] text-neutral-400 font-light mt-0.5">
                Calm Intelligence
              </span>
            </div>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Primary Actions: New Chat & Search */}
      <div className="p-2.5 space-y-1.5">
        <button
          onClick={() => {
            onNewChat();
            if (isMobile) onCloseMobile?.();
          }}
          className={`w-full flex items-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-95 shadow-sm transition-all ${
            collapsed && !isMobile ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
          }`}
          title="New Conversation (Cmd+N)"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            {(!collapsed || isMobile) && <span>New Chat</span>}
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-[10px] opacity-60 font-mono">⌘N</span>
          )}
        </button>

        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 text-xs transition-colors ${
            collapsed && !isMobile ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
          }`}
          title="Search all conversations (Cmd+K)"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-neutral-400" />
            {(!collapsed || isMobile) && <span>Search</span>}
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-[10px] text-neutral-400 font-mono">⌘K</span>
          )}
        </button>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 no-scrollbar py-2">
        {/* Pinned Section */}
        {pinnedList.length > 0 && (
          <div>
            {(!collapsed || isMobile) && (
              <div className="flex items-center space-x-1.5 px-2 mb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <Pin className="w-3 h-3 rotate-45" />
                <span>Pinned</span>
              </div>
            )}
            <div className="space-y-0.5">
              {pinnedList.map(c => renderConvItem(c))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div>
          {(!collapsed || isMobile) && (
            <div className="px-2 mb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Recent
            </div>
          )}
          <div className="space-y-0.5">
            {unpinnedList.map(c => renderConvItem(c))}
          </div>

          {conversations.length === 0 && (!collapsed || isMobile) && (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No conversations yet. Start a new chat above.
            </div>
          )}
        </div>
      </div>

      {/* Footer Utility Bar */}
      <div className="p-2.5 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center rounded-xl text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors ${
            collapsed && !isMobile ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          {(!collapsed || isMobile) && <span>Settings</span>}
        </button>

        {/* Admin Portal button */}
        <button
          onClick={onOpenAdmin}
          className={`w-full flex items-center rounded-xl text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors ${
            collapsed && !isMobile ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
          }`}
          title="Admin & Model Health Control"
        >
          <Shield className="w-4 h-4 text-neutral-400" />
          {(!collapsed || isMobile) && (
            <div className="flex items-center space-x-1.5">
              <span>Admin / CMS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </button>

        {/* Quick Theme Switcher */}
        {(!collapsed || isMobile) && (
          <div className="pt-1.5 flex items-center justify-between px-3 text-xs text-neutral-400">
            <span>Theme</span>
            <button
              onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              title="Toggle theme"
            >
              {settings.theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  function renderConvItem(conv: Conversation) {
    const isSelected = activeConversationId === conv.id;
    const isEditing = editingId === conv.id;

    if (collapsed && !isMobile) {
      return (
        <button
          key={conv.id}
          onClick={() => onSelectConversation(conv.id)}
          className={`w-full flex justify-center p-2 rounded-xl transition-colors ${
            isSelected
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-700'
          }`}
          title={conv.title}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      );
    }

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center rounded-xl transition-all ${
          isSelected
            ? 'bg-neutral-200/80 dark:bg-neutral-800/90 text-neutral-900 dark:text-white font-medium shadow-sm'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        {isEditing ? (
          <div className="flex-1 flex items-center px-2 py-1 space-x-1">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveRename(conv.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="w-full text-xs bg-white dark:bg-neutral-900 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 focus:outline-none"
            />
            <button
              onClick={() => handleSaveRename(conv.id)}
              className="p-1 text-emerald-600 hover:bg-neutral-100 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onSelectConversation(conv.id);
              if (isMobile) onCloseMobile?.();
            }}
            className="flex-1 flex items-center space-x-2 px-3 py-2 text-left text-xs truncate min-w-0"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">{conv.title}</span>
          </button>
        )}

        {/* Hover Action Menu */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 pr-1.5 transition-opacity">
            <button
              onClick={e => {
                e.stopPropagation();
                onUpdateConversation(conv.id, { pinned: !conv.pinned });
              }}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title={conv.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`w-3 h-3 ${conv.pinned ? 'fill-current rotate-45' : ''}`} />
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                handleStartRename(conv);
              }}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title="Rename"
            >
              <Pencil className="w-3 h-3" />
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="p-1 rounded text-neutral-400 hover:text-rose-500"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }
};
