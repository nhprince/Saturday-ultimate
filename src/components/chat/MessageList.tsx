import React, { useRef, useEffect } from 'react';
import { ChatMessage, UserSettings, AdminCMSConfig } from '../../types';
import { MessageItem } from './MessageItem';
import { LandingWelcome } from './LandingWelcome';

interface MessageListProps {
  messages: ChatMessage[];
  settings: UserSettings;
  cmsConfig?: AdminCMSConfig;
  onSelectPrompt: (prompt: string) => void;
  onRegenerateLast?: () => void;
  onEditUserMessage?: (index: number, newContent: string) => void;
  onSpeakText?: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  settings,
  cmsConfig,
  onSelectPrompt,
  onRegenerateLast,
  onEditUserMessage,
  onSpeakText,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.content, messages[messages.length - 1]?.reasoningContent]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center overflow-y-auto">
        <LandingWelcome cmsConfig={cmsConfig} onSelectPrompt={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 max-w-4xl w-full mx-auto"
    >
      {messages.map((msg, idx) => (
        <MessageItem
          key={msg.id || idx}
          message={msg}
          settings={settings}
          onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? onRegenerateLast : undefined}
          onEdit={msg.role === 'user' ? (newContent) => onEditUserMessage?.(idx, newContent) : undefined}
          onSpeak={onSpeakText}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
