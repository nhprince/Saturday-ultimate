import React from 'react';
import { X, FileText, Image as ImageIcon, FileCode, Paperclip } from 'lucide-react';
import { ChatAttachment } from '../../types';
import { formatBytes } from '../../lib/utils';

interface AttachmentChipProps {
  attachment: ChatAttachment;
  onRemove?: () => void;
  compact?: boolean;
}

export const AttachmentChip: React.FC<AttachmentChipProps> = ({ attachment, onRemove, compact = false }) => {
  const isImage = attachment.type?.startsWith('image/') || !!attachment.dataUrl;
  const isCode = attachment.name.endsWith('.ts') || attachment.name.endsWith('.js') || attachment.name.endsWith('.py') || attachment.name.endsWith('.json');

  return (
    <div className="group relative flex items-center space-x-2 pl-2 pr-1.5 py-1 rounded-xl bg-white/80 dark:bg-[#1c1c22]/90 border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm transition-all text-xs text-neutral-800 dark:text-neutral-200">
      {/* Thumbnail or Icon */}
      {isImage && attachment.dataUrl ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="w-7 h-7 object-cover rounded-lg border border-neutral-200/60 dark:border-neutral-700/60"
        />
      ) : isCode ? (
        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
          <FileCode className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
          <FileText className="w-4 h-4" />
        </div>
      )}

      {/* Details */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="truncate max-w-[120px] font-medium text-[11px] leading-tight">
          {attachment.name}
        </span>
        <span className="text-[9px] text-neutral-400 font-mono">
          {formatBytes(attachment.size)}
        </span>
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Remove attachment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
