import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  Sparkles,
  Zap,
  Globe,
  Code2,
  ChevronDown,
  X
} from 'lucide-react';
import { ChatAttachment, AIModel } from '../../types';
import { AttachmentChip } from './AttachmentChip';
import { fileToAttachment, SoundEffects } from '../../lib/utils';

interface ComposerProps {
  onSendMessage: (text: string, attachments: ChatAttachment[]) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  selectedModelId: string;
  onOpenModelSelector: () => void;
  onOpenVoiceMode: () => void;
  availableModels: AIModel[];
  enterToSend?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  selectedModelId,
  onOpenModelSelector,
  onOpenVoiceMode,
  availableModels,
  enterToSend = true,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming) return;

    SoundEffects.playPop();
    onSendMessage(trimmed, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (enterToSend && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const att = await fileToAttachment(files[i]);
        setAttachments(prev => [...prev, att]);
      } catch (err) {
        console.error('File parsing error', err);
      }
    }
    // reset input
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const att = await fileToAttachment(files[i]);
        setAttachments(prev => [...prev, att]);
      } catch (err) {}
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const att = await fileToAttachment(file);
          setAttachments(prev => [...prev, att]);
        }
      }
    }
  };

  // Find model display info for the composer pill
  const modelInfo = availableModels.find(m => m.id === selectedModelId);
  const modelLabel =
    selectedModelId === 'smart-router'
      ? 'Smart Router'
      : selectedModelId === 'free-router'
      ? 'Free Router'
      : modelInfo?.displayName || selectedModelId.split('/').pop() || 'Model';

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative w-full max-w-3xl mx-auto rounded-2xl liquid-glass-elevated transition-all duration-200 ${
        isDragging ? 'ring-2 ring-neutral-400 dark:ring-neutral-500 scale-[1.01]' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-1 border-b border-neutral-100 dark:border-neutral-800/80">
          {attachments.map((att, idx) => (
            <AttachmentChip
              key={att.id || idx}
              attachment={att}
              onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
            />
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="flex flex-col p-2.5 sm:p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          placeholder="Ask Saturday anything..."
          className="w-full bg-transparent resize-none border-0 text-sm sm:text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 px-1 py-1 max-h-48"
        />

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800/60">
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors"
              title="Attach images, documents, or code"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mode Button */}
            <button
              type="button"
              onClick={onOpenVoiceMode}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors"
              title="Start Voice Conversation"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Model Selector Quick Pill */}
            <button
              type="button"
              onClick={onOpenModelSelector}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors select-none"
            >
              {selectedModelId === 'smart-router' ? (
                <Sparkles className="w-3 h-3 text-emerald-500" />
              ) : selectedModelId === 'free-router' ? (
                <Zap className="w-3 h-3 text-amber-500" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              )}
              <span className="truncate max-w-[110px] sm:max-w-[160px]">{modelLabel}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          </div>

          {/* Right Action: Send / Stop button */}
          <div className="flex items-center space-x-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="w-8 h-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center hover:opacity-90 transition-all shadow-sm"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() && attachments.length === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  text.trim() || attachments.length > 0
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md hover:scale-105 active:scale-95'
                    : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
