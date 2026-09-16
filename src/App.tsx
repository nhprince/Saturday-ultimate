import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageList } from './components/chat/MessageList';
import { Composer } from './components/chat/Composer';
import { ModelSelectorPopover } from './components/models/ModelSelectorPopover';
import { VoiceModeModal } from './components/voice/VoiceModeModal';
import { SearchModal } from './components/search/SearchModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { api } from './lib/api';
import {
  Conversation,
  ChatMessage,
  AIModel,
  ProviderInfo,
  UserSettings,
  AdminCMSConfig,
  ChatAttachment
} from './types';
import { SoundEffects } from './lib/utils';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  compactMode: false,
  enterToSend: true,
  showTimestamps: true,
  showReasoningByDefault: true,
  voiceName: 'Default',
  speechSpeed: 1.0,
  autoSpeak: false,
  hapticFeedback: true,
};

export function App() {
  // Application Data States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [cmsConfig, setCmsConfig] = useState<AdminCMSConfig | null>(null);

  // Router / Model Choice
  const [selectedModelId, setSelectedModelId] = useState<string>('smart-router');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // UI Dialog / Modal States
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);

  // User Settings State (with localStorage persistence)
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('saturday_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply Theme class
  useEffect(() => {
    try {
      localStorage.setItem('saturday_settings', JSON.stringify(settings));
    } catch {}

    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Initial Load: Models, Providers, CMS, Conversations
  const refreshTelemetry = useCallback(async () => {
    try {
      const [allModels, allProviders, cms, convs] = await Promise.all([
        api.getModels(),
        api.getProviders(),
        api.admin.getCMS(),
        api.getConversations(),
      ]);

      setModels(allModels);
      setProviders(allProviders);
      setCmsConfig(cms);
      setConversations(convs);

      // Select latest conversation or initialize
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
        setMessages(convs[0].messages || []);
        if (convs[0].modelUsed) {
          setSelectedModelId(convs[0].modelUsed);
        }
      }
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  }, [activeConversationId]);

  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Load active conversation messages when switched
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const current = conversations.find(c => c.id === activeConversationId);
    if (current) {
      setMessages(current.messages || []);
      if (current.modelUsed) {
        setSelectedModelId(current.modelUsed);
      }
    }
  }, [activeConversationId, conversations]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Global Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      // Cmd/Ctrl + N -> New Chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      // Cmd/Ctrl + M -> Model Selector
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setModelSelectorOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Conversation Actions
  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation('New Conversation', selectedModelId);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      SoundEffects.playPop();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setMessages(conv.messages || []);
    }
  };

  const handleUpdateConversation = async (id: string, updates: Partial<Conversation>) => {
    try {
      const updated = await api.updateConversation(id, updates);
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearAllConversations();
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `saturday-conversations-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Model Health Verification Runner
  const handleRefreshHealth = async () => {
    setIsRefreshingModels(true);
    try {
      await api.runBatchHealthCheck();
      const freshModels = await api.getModels(true);
      setModels(freshModels);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  // Text-To-Speech Output
  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown tags and math for clean voice readout
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Mathematical equation.')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 1000));
    utterance.rate = settings.speechSpeed || 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      }
      return prev;
    });
  };

  // Send Message Logic with Streaming & Fallback
  const handleSendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;

    let targetConvId = activeConversationId;

    // If no active conversation, create one automatically
    if (!targetConvId) {
      const generatedTitle = text.trim().slice(0, 36) || 'New Conversation';
      const created = await api.createConversation(generatedTitle, selectedModelId);
      setConversations(prev => [created, ...prev]);
      setActiveConversationId(created.id);
      targetConvId = created.id;
    } else {
      // If first message in untitled conversation, auto-generate title
      const current = conversations.find(c => c.id === targetConvId);
      if (current && (!current.messages || current.messages.length === 0)) {
        const generatedTitle = text.trim().slice(0, 36) || 'New Conversation';
        handleUpdateConversation(targetConvId, { title: generatedTitle });
      }
    }

    const userMessage: ChatMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const initialAssistantMessage: ChatMessage = {
      id: 'msg_a_' + Date.now(),
      role: 'assistant',
      content: '',
      reasoningContent: '',
      timestamp: new Date().toISOString(),
      modelUsed: selectedModelId,
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, initialAssistantMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const streamPayload = {
      conversationId: targetConvId,
      messages: updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
      modelId: selectedModelId,
    };

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let responseModel = selectedModelId;
    let responseProvider = 'saturday';
    let decision = undefined;

    await api.streamChat(
      streamPayload,
      {
        onMeta: meta => {
          responseModel = meta.model;
          responseProvider = meta.provider;
          decision = meta.routingDecision;

          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  modelUsed: responseModel,
                  providerUsed: responseProvider,
                  routingDecision: decision,
                },
              ];
            }
            return prev;
          });
        },
        onReasoning: chunk => {
          accumulatedReasoning += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, reasoningContent: accumulatedReasoning },
              ];
            }
            return prev;
          });
        },
        onDelta: chunk => {
          accumulatedContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, content: accumulatedContent },
              ];
            }
            return prev;
          });
        },
        onError: err => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: accumulatedContent
                    ? `${accumulatedContent}\n\n> ⚠️ *Notice: ${err}*`
                    : `> ⚠️ **Provider Notice:** ${err}\n\nYou can switch models via the router pill or configure upstream credentials in the Admin Portal.`,
                  isStreaming: false,
                },
              ];
            }
            return prev;
          });
          setIsStreaming(false);
        },
        onDone: () => {
          setIsStreaming(false);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, isStreaming: false },
              ];
            }
            return prev;
          });

          if (settings.autoSpeak && accumulatedContent) {
            handleSpeakText(accumulatedContent);
          }
        },
      },
      abortController.signal
    );
  };

  const currentConv = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#fafafc] dark:bg-[#0c0c0e] font-sans antialiased text-[#1c1c1e] dark:text-[#f4f4f7]">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId || undefined}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          onUpdateConversation={handleUpdateConversation}
          onDeleteConversation={handleDeleteConversation}
          settings={settings}
          onUpdateSettings={s => setSettings(prev => ({ ...prev, ...s }))}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-50 w-72 h-full animate-slide-up">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onOpenSearch={() => {
                setMobileDrawerOpen(false);
                setSearchOpen(true);
              }}
              onOpenSettings={() => {
                setMobileDrawerOpen(false);
                setSettingsOpen(true);
              }}
              onOpenAdmin={() => {
                setMobileDrawerOpen(false);
                setAdminOpen(true);
              }}
              onUpdateConversation={handleUpdateConversation}
              onDeleteConversation={handleDeleteConversation}
              settings={settings}
              onUpdateSettings={s => setSettings(prev => ({ ...prev, ...s }))}
              collapsed={false}
              onToggleCollapse={() => {}}
              isMobile={true}
              onCloseMobile={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Chat Layout Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Compact Conversation Header */}
        <Header
          currentConversation={currentConv}
          onToggleMobileMenu={() => setMobileDrawerOpen(true)}
          selectedModelId={selectedModelId}
          onOpenModelSelector={() => setModelSelectorOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onNewChat={handleNewChat}
          onRenameConversation={title => {
            if (activeConversationId) handleUpdateConversation(activeConversationId, { title });
          }}
          onDeleteConversation={() => {
            if (activeConversationId) handleDeleteConversation(activeConversationId);
          }}
          availableModels={models}
        />

        {/* Message Reading Environment */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <MessageList
            messages={messages}
            settings={settings}
            cmsConfig={cmsConfig || undefined}
            onSelectPrompt={prompt => handleSendMessage(prompt)}
            onRegenerateLast={() => {
              if (messages.length >= 2) {
                const lastUser = [...messages].reverse().find(m => m.role === 'user');
                if (lastUser) {
                  handleSendMessage(lastUser.content, lastUser.attachments);
                }
              }
            }}
            onEditUserMessage={(idx, newContent) => {
              handleSendMessage(newContent);
            }}
            onSpeakText={handleSpeakText}
          />

          {/* Floating Liquid-Glass Composer */}
          <div className="p-3 sm:p-5 w-full shrink-0 z-10">
            <Composer
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              isStreaming={isStreaming}
              selectedModelId={selectedModelId}
              onOpenModelSelector={() => setModelSelectorOpen(true)}
              onOpenVoiceMode={() => setVoiceModeOpen(true)}
              availableModels={models}
              enterToSend={settings.enterToSend}
            />
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <ModelSelectorPopover
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={id => setSelectedModelId(id)}
        isOpen={modelSelectorOpen}
        onClose={() => setModelSelectorOpen(false)}
        onRefreshHealth={handleRefreshHealth}
        isRefreshing={isRefreshingModels}
      />

      <VoiceModeModal
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        onSendSpokenPrompt={prompt => handleSendMessage(prompt)}
        lastAssistantMessage={messages[messages.length - 1]?.content}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={s => setSettings(prev => ({ ...prev, ...s }))}
        providers={providers}
        onOpenAdmin={() => {
          setSettingsOpen(false);
          setAdminOpen(true);
        }}
        onClearHistory={handleClearHistory}
        onExportHistory={handleExportHistory}
      />

      <AdminPortal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onRefreshAllData={refreshTelemetry}
      />
    </div>
  );
}
