import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  Check,
  Cpu,
  Eye,
  Terminal,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Server
} from 'lucide-react';
import { AIModel } from '../../types';
import { ModelStatusBadge } from './ModelStatusBadge';

interface ModelSelectorPopoverProps {
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onRefreshHealth?: () => void;
  isRefreshing?: boolean;
}

export const ModelSelectorPopover: React.FC<ModelSelectorPopoverProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  isOpen,
  onClose,
  onRefreshHealth,
  isRefreshing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<'all' | 'reasoning' | 'vision' | 'free'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      // Capability filter
      if (capabilityFilter === 'reasoning' && !m.capabilities.reasoning) return false;
      if (capabilityFilter === 'vision' && !m.capabilities.vision) return false;
      if (capabilityFilter === 'free' && !m.isFree) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.providerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [models, searchQuery, capabilityFilter]);

  // Group models by provider
  const groupedByProvider = useMemo(() => {
    const groups: Record<string, AIModel[]> = {};
    for (const model of filteredModels) {
      const provider = model.providerName || model.provider;
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    }
    return groups;
  }, [filteredModels]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        ref={popoverRef}
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
      >
        {/* Header & Search Bar */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#1a1a1e]/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-medium text-xs">
                S
              </div>
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
                Intelligence Engine
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {onRefreshHealth && (
                <button
                  onClick={onRefreshHealth}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Run model health verification"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search models, reasoning engines, providers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Capability Filters */}
          <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto no-scrollbar text-xs">
            {(['all', 'reasoning', 'vision', 'free'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setCapabilityFilter(filter)}
                className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors text-[11px] font-medium ${
                  capabilityFilter === filter
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700/60'
                }`}
              >
                {filter === 'all' ? 'All Models' : filter === 'reasoning' ? 'Reasoning' : filter === 'vision' ? 'Multimodal' : 'Zero-Cost Free'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Model Catalog Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[60vh]">
          {/* Automatic Routers Section */}
          {!searchQuery && capabilityFilter === 'all' && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-2">
                Intelligent Autonomous Routers
              </div>

              {/* Smart Router Card */}
              <button
                onClick={() => {
                  onSelectModel('smart-router');
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between group ${
                  selectedModelId === 'smart-router'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50/80 dark:bg-neutral-800/40 shadow-sm'
                    : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/40 dark:hover:bg-neutral-800/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                        Smart Router
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Analyzes prompt intent (coding, math proof, vision, fast-path) and dispatches to the healthiest provider with edge fallback.
                    </p>
                  </div>
                </div>

                <div className="pl-2">
                  {selectedModelId === 'smart-router' && (
                    <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>

              {/* Free Router Card */}
              <button
                onClick={() => {
                  onSelectModel('free-router');
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between group ${
                  selectedModelId === 'free-router'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50/80 dark:bg-neutral-800/40 shadow-sm'
                    : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/40 dark:hover:bg-neutral-800/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                        Free Router
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        Zero Cost Guarantee
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Exclusively routes across certified free-tier models (NVIDIA NIM free allocations, OpenRouter :free, Cloudflare Edge).
                    </p>
                  </div>
                </div>

                <div className="pl-2">
                  {selectedModelId === 'free-router' && (
                    <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Discovered Provider Model Groups */}
          {Object.entries(groupedByProvider).map(([providerName, modelList]) => (
            <div key={providerName} className="space-y-1.5">
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {providerName}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {modelList.length} models
                </span>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden bg-white dark:bg-[#121215]">
                {modelList.map(model => {
                  const isSelected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        onClose();
                      }}
                      className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-neutral-50 dark:bg-neutral-800/50'
                          : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-neutral-900 dark:text-white">
                            {model.displayName}
                          </span>
                          <ModelStatusBadge health={model.health} latencyMs={model.latencyMs} compact />
                          {model.isFree && (
                            <span className="text-[9px] px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                              Free
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2.5 mt-1 text-[11px] text-neutral-400 font-mono">
                          <span>{model.id}</span>
                          {model.capabilities.reasoning && (
                            <span className="text-purple-600 dark:text-purple-400 flex items-center space-x-0.5">
                              <span>•</span>
                              <span>Reasoning</span>
                            </span>
                          )}
                          {model.capabilities.vision && (
                            <span className="text-blue-600 dark:text-blue-400 flex items-center space-x-0.5">
                              <span>•</span>
                              <span>Vision</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredModels.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-400">
              No models match your search or filter.
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#18181c]/50 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Health check TTL cache active (3m)</span>
          </div>
          <span className="text-[10px] text-neutral-400">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
