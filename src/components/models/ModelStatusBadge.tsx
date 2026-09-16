import React from 'react';
import { ModelHealthStatus } from '../../types';

interface ModelStatusBadgeProps {
  health: ModelHealthStatus;
  latencyMs?: number;
  compact?: boolean;
}

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ health, latencyMs, compact = false }) => {
  let dotColor = 'bg-neutral-400';
  let label = 'Unknown';

  switch (health) {
    case 'WORKING':
      dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      label = latencyMs ? `${latencyMs}ms` : 'Ready';
      break;
    case 'DEGRADED':
      dotColor = 'bg-amber-500';
      label = 'Degraded';
      break;
    case 'RATE_LIMITED':
      dotColor = 'bg-orange-500';
      label = 'Rate Limited';
      break;
    case 'AUTH_FAILED':
      dotColor = 'bg-rose-500';
      label = 'Key Needed';
      break;
    case 'TIMEOUT':
      dotColor = 'bg-rose-400';
      label = 'Timeout';
      break;
    case 'ERROR':
    case 'NOT_FOUND':
    case 'UNSUPPORTED':
      dotColor = 'bg-rose-500';
      label = 'Offline';
      break;
    default:
      dotColor = 'bg-neutral-400';
      label = 'Standby';
  }

  if (compact) {
    return (
      <span className="flex items-center space-x-1.5" title={`Health: ${health}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {latencyMs !== undefined && (
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
            {latencyMs}ms
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
