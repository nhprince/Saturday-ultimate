import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Cpu,
  Trash2,
  Download,
  Check,
  Shield,
  Key,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { UserSettings, ThemeMode, ProviderInfo } from '../../types';
import { api } from '../../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  providers: ProviderInfo[];
  onOpenAdmin: () => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  providers,
  onOpenAdmin,
  onClearHistory,
  onExportHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'chat' | 'voice' | 'ai' | 'privacy'>('appearance');
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#18181c]/50">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="font-semibold text-sm text-neutral-900 dark:text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-4 bg-white dark:bg-[#151518] overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'appearance', label: 'Appearance' },
              { id: 'chat', label: 'Chat & Interaction' },
              { id: 'voice', label: 'Voice' },
              { id: 'ai', label: 'AI & Routing' },
              { id: 'privacy', label: 'Privacy & Data' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2.5">
                  Theme Palette
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'light', label: 'Soft White Luxury', icon: Sun },
                    { id: 'dark', label: 'Onyx Dark', icon: Moon },
                    { id: 'system', label: 'System Automatic', icon: Monitor },
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onUpdateSettings({ theme: t.id as ThemeMode })}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/80 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Compact Interface</div>
                  <div className="text-[11px] text-neutral-400">Reduce spacing and padding for maximum message density.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={e => onUpdateSettings({ compactMode: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Enter to Send</div>
                  <div className="text-[11px] text-neutral-400">Press Enter to send message, Shift+Enter for new line.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enterToSend}
                  onChange={e => onUpdateSettings({ enterToSend: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Display Timestamps</div>
                  <div className="text-[11px] text-neutral-400">Show relative timestamps next to messages.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={e => onUpdateSettings({ showTimestamps: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Expand Reasoning by Default</div>
                  <div className="text-[11px] text-neutral-400">Automatically expand chain-of-thought blocks when streaming.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showReasoningByDefault}
                  onChange={e => onUpdateSettings({ showReasoningByDefault: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Autoplay Audio Responses</div>
                  <div className="text-[11px] text-neutral-400">Automatically speak answers aloud in Voice Mode.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={e => onUpdateSettings({ autoSpeak: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Speech Synthesis Speed ({settings.speechSpeed}x)
                </label>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={settings.speechSpeed}
                  onChange={e => onUpdateSettings({ speechSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* AI & Routing Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-neutral-900 dark:text-white">Active Upstream Providers</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-300 hover:underline"
                  >
                    <span>Manage Keys in Admin</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {providers.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-neutral-200/40 dark:border-neutral-700/40 last:border-0">
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">{p.name}</span>
                        <span className="text-neutral-400 text-[10px] ml-2">{p.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        p.configured ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                      }`}>
                        {p.configured ? 'Configured' : 'Available (Local Fallback)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 leading-relaxed">
                Saturday implements a zero-cost principle with dynamic NVIDIA NIM discovery, OpenRouter free models, and Cloudflare Edge AI. Upstream provider secrets are stored securely on the backend and never sent to browser code.
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-medium text-xs text-neutral-900 dark:text-white">Export Chat History</div>
                  <div className="text-[11px] text-neutral-400">Download all conversations, thoughts, and attachment references as JSON.</div>
                </div>
                <button
                  onClick={onExportHistory}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-xs text-rose-600 dark:text-rose-400">Clear All Conversations</div>
                  <div className="text-[11px] text-neutral-400">Permanently erase all chat records and stored session caches.</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently delete all conversations?')) {
                      onClearHistory();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#18181c]/50 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>Saturday v1.0.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-sans font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
