import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Info, ChevronDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RoutingDecision } from '../../types';

interface RoutingBadgeProps {
  decision?: RoutingDecision;
  modelUsed?: string;
  providerUsed?: string;
}

export const RoutingBadge: React.FC<RoutingBadgeProps> = ({ decision, modelUsed, providerUsed }) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  const strategy = decision?.strategy || 'smart';
  const effectiveModel = decision?.selectedModel || modelUsed || 'Saturday Prime';
  const effectiveProvider = decision?.provider || providerUsed || 'Saturday';

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="group flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/60 border border-neutral-200/50 dark:border-neutral-700/50 transition-all select-none"
        title="Click to view routing inspection"
      >
        {strategy === 'smart' ? (
          <Sparkles className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
        ) : strategy === 'free' ? (
          <Zap className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        )}
        <span className="font-sans font-medium text-[11px]">
          {strategy === 'smart' ? 'Smart Router' : strategy === 'free' ? 'Free Router' : 'Direct'}
        </span>
        <span>·</span>
        <span className="truncate max-w-[130px]">{effectiveModel.split('/').pop()}</span>
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {/* Routing Decision Inspection Popover */}
      {showPopover && (
        <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-white dark:bg-[#161619] border border-neutral-200 dark:border-neutral-800 shadow-xl z-30 text-xs animate-fade-in text-neutral-800 dark:text-neutral-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/80 mb-2.5">
            <div className="flex items-center space-x-1.5 font-semibold text-neutral-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Routing Pipeline Decision</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
              {strategy}
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-sans">Provider / Model:</span>
              <span className="text-neutral-900 dark:text-white font-medium">{effectiveProvider} / {effectiveModel}</span>
            </div>

            {decision?.taskClassification && (
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-sans">Task Classification:</span>
                <span className="text-neutral-900 dark:text-white capitalize">
                  {decision.taskClassification} mode {decision.confidenceScore ? `(${Math.round(decision.confidenceScore * 100)}% match)` : ''}
                </span>
              </div>
            )}

            {decision?.reason && (
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-sans">Selection Rationale:</span>
                <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed bg-neutral-50 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50">
                  {decision.reason}
                </p>
              </div>
            )}

            {decision?.fallbackOccurred && (
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Primary upstream model degraded; fallback model auto-selected seamlessly.</span>
              </div>
            )}

            {decision?.triedModels && decision.triedModels.length > 1 && (
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-sans">Failover Trace:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {decision.triedModels.map((m, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        idx === decision.triedModels!.length - 1
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-500 line-through'
                      }`}
                    >
                      {m.split('/').pop()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
