import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import { SoundEffects } from '../../lib/utils';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSpokenPrompt: (prompt: string) => void;
  lastAssistantMessage?: string;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen,
  onClose,
  onSendSpokenPrompt,
  lastAssistantMessage,
}) => {
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
      return;
    }

    SoundEffects.playChime();
    setState('listening');

    // Attempt real Web Speech API recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onend = () => {
        if (transcript.trim()) {
          setState('processing');
          setTimeout(() => {
            onSendSpokenPrompt(transcript.trim());
            setTranscript('');
            setState('speaking');
          }, 800);
        } else {
          setState('listening');
        }
      };

      recognition.onerror = () => {
        setState('idle');
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {}
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen]);

  const handleSimulateVoice = (phrase: string) => {
    setTranscript(phrase);
    setState('processing');
    setTimeout(() => {
      onSendSpokenPrompt(phrase);
      setTranscript('');
      setState('speaking');
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-white/90 dark:bg-[#151518]/90 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center text-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 text-xs font-medium text-neutral-500">
            <Sparkles className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>Saturday Voice Mode</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Liquid Visualizer Orb */}
        <div className="relative my-8 flex items-center justify-center">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${
              state === 'listening'
                ? 'bg-neutral-100 dark:bg-neutral-800 ring-8 ring-neutral-200/50 dark:ring-neutral-700/30 scale-105'
                : state === 'speaking'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 ring-8 ring-neutral-400/40 scale-110'
                : 'bg-neutral-50 dark:bg-neutral-900 ring-4 ring-neutral-100 dark:ring-neutral-800'
            }`}
          >
            {/* Visualizer Wave Bars */}
            <div className="flex items-center space-x-1.5">
              {[0.4, 0.9, 0.6, 1.0, 0.7, 0.4].map((scale, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    state === 'speaking'
                      ? 'bg-white dark:bg-neutral-900 h-8 animate-pulse'
                      : state === 'listening'
                      ? 'bg-neutral-900 dark:bg-white h-6 animate-pulse'
                      : 'bg-neutral-300 dark:bg-neutral-700 h-2'
                  }`}
                  style={{
                    animationDelay: `${i * 120}ms`,
                    height: state === 'listening' || state === 'speaking' ? `${scale * 32}px` : '6px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* State Label */}
        <div className="mb-4">
          <h3 className="text-base font-semibold capitalize text-neutral-900 dark:text-white">
            {state === 'listening' ? 'Listening...' : state === 'processing' ? 'Synthesizing...' : state === 'speaking' ? 'Speaking...' : 'Ready'}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {state === 'listening' ? 'Speak clearly into your microphone' : 'Saturday is formulating a calm response'}
          </p>
        </div>

        {/* Live Transcript / Suggestions */}
        {showTranscript && (
          <div className="w-full min-h-[50px] p-3 rounded-2xl bg-neutral-100/70 dark:bg-[#1b1b20]/70 border border-neutral-200/50 dark:border-neutral-800/50 text-xs text-neutral-700 dark:text-neutral-300 mb-6 font-mono text-center">
            {transcript || (
              <span className="text-neutral-400 font-sans italic">
                “What can we explore today?”
              </span>
            )}
          </div>
        )}

        {/* Quick Voice Prompt Suggestions */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6 text-xs">
          <button
            onClick={() => handleSimulateVoice('Explain how attention mechanisms work in transformers')}
            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            “Explain transformers”
          </button>
          <button
            onClick={() => handleSimulateVoice('Help me organize my priorities for today')}
            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            “Organize priorities”
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full border transition-all ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:scale-105'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            End Conversation
          </button>
        </div>
      </div>
    </div>
  );
};
