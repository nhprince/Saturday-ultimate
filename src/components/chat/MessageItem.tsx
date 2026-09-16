import React, { useState } from 'react';
import { Copy, Check, Volume2, RotateCcw, Pencil, Sparkles, User, Brain } from 'lucide-react';
import { ChatMessage, UserSettings } from '../../types';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { AttachmentChip } from './AttachmentChip';
import { RoutingBadge } from './RoutingBadge';
import { ReasoningBlock } from './ReasoningBlock';
import { formatTimeAgo } from '../../lib/utils';

interface MessageItemProps {
  message: ChatMessage;
  settings: UserSettings;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onSpeak?: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  settings,
  onRegenerate,
  onEdit,
  onSpeak,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end py-2 px-1 animate-fade-in group">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
          {/* User Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5 mb-1.5">
              {message.attachments.map((att, idx) => (
                <AttachmentChip key={att.id || idx} attachment={att} compact />
              ))}
            </div>
          )}

          {/* User Message Bubble */}
          <div className="px-4 py-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm text-sm leading-relaxed">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 p-2 rounded-lg text-sm focus:outline-none"
                  rows={2}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs px-2 py-1 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-2.5 py-1 rounded bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white font-medium"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* User Meta Row */}
          <div className="flex items-center space-x-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400">
            {settings.showTimestamps && <span>{formatTimeAgo(message.timestamp)}</span>}
            {onEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                title="Edit message"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message (Open, editorial typographic reading experience)
  return (
    <div className="py-4 px-1 animate-fade-in group">
      <div className="max-w-3xl">
        {/* Assistant Header & Routing Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-medium text-[10px]">
              S
            </div>
            <span className="font-semibold text-xs text-neutral-900 dark:text-white">
              Saturday
            </span>
          </div>

          <RoutingBadge
            decision={message.routingDecision}
            modelUsed={message.modelUsed}
            providerUsed={message.providerUsed}
          />
        </div>

        {/* Deliberate Reasoning Step (if present) */}
        {message.reasoningContent && (
          <ReasoningBlock
            reasoning={message.reasoningContent}
            isStreaming={message.isStreaming && !message.content}
          />
        )}

        {/* Message Content rendered in Markdown / LaTeX / Code */}
        <div className="pl-0 sm:pl-7">
          <MarkdownRenderer content={message.content} />

          {/* Streaming Cursor */}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-neutral-900 dark:bg-white animate-pulse align-middle" />
          )}

          {/* Action Toolbar */}
          {!message.isStreaming && message.content && (
            <div className="flex items-center space-x-1.5 mt-3 pt-2 text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors text-xs">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {onSpeak && (
                <button
                  onClick={() => onSpeak(message.content)}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {settings.showTimestamps && (
                <span className="text-[10px] text-neutral-400 ml-2 font-mono">
                  {formatTimeAgo(message.timestamp)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
