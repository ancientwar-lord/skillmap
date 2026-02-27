'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Send,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  response: string;
  isLoading: boolean;
  title?: string;
  chatKey?: string;
  context?: {
    type: 'task' | 'subtask';
    taskTitle: string;
    subtaskTitle?: string;
  };
}

// ── localStorage helpers ──

const STORAGE_PREFIX = 'skillmap-ai-chat-';

function loadChatHistory(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(key: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(messages));
  } catch {
    throw new Error(
      'Storage is full — could not save chat history. Try clearing old chats.'
    );
  }
}

function clearChatHistory(key: string) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    throw new Error('Could not clear chat history from storage.');
  }
}

// ── Component ──

const AIResponseOverlay: React.FC<AIResponseOverlayProps> = ({
  isOpen,
  onClose,
  response,
  isLoading,
  title,
  chatKey,
  context,
}) => {
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'warning';
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'error' | 'warning' = 'error') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  // Load chat history from localStorage when overlay opens with a new chatKey
  useEffect(() => {
    if (isOpen && chatKey) {
      const saved = loadChatHistory(chatKey);
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        setMessages([]);
      }
    }
  }, [isOpen, chatKey]);

  // When the initial AI response arrives, add it as the first assistant message
  useEffect(() => {
    if (!response || isLoading) return;

    setMessages((prev) => {
      if (prev.length > 0 && prev[0]?.content === response) return prev;
      if (prev.length > 0 && prev[0]?.role === 'assistant') return prev;
      const newMessages: ChatMessage[] = [
        { role: 'assistant', content: response },
      ];
      try {
        if (chatKey) saveChatHistory(chatKey, newMessages);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to save chat history.'
        );
      }
      return newMessages;
    });
  }, [response, isLoading, chatKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, followUpLoading]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopyLast = async () => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    try {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(
        'Failed to copy — your browser blocked clipboard access. Try selecting the text manually.'
      );
    }
  };

  const handleClearHistory = () => {
    try {
      if (chatKey) clearChatHistory(chatKey);
      setMessages([]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to clear chat history.'
      );
    }
  };

  const handleFollowUp = async () => {
    const question = followUpInput.trim();
    if (!question || followUpLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setFollowUpInput('');
    setFollowUpLoading(true);

    try {
      const res = await fetch('/api/roadmaps/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'followup',
          taskTitle: context?.taskTitle || title || '',
          subtaskTitle: context?.subtaskTitle,
          followUpQuestion: question,
          chatHistory: updatedMessages.slice(-10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText =
          data.error || `Server error (${res.status}). Please try again.`;
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ **Error:** ${errorText}`,
        };
        const finalMessages = [...updatedMessages, errorMsg];
        setMessages(finalMessages);
        showToast(errorText);
        return;
      }

      const aiText =
        data.ainotes || 'Sorry, I could not generate a response. Try again.';

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiText,
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Save to localStorage
      try {
        if (chatKey) saveChatHistory(chatKey, finalMessages);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to save chat history.',
          'warning'
        );
      }
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message === 'Failed to fetch'
            ? 'Network error — check your internet connection and try again.'
            : err.message
          : 'An unexpected error occurred.';
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `⚠️ **Error:** ${errorText}`,
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      showToast(errorText);
    } finally {
      setFollowUpLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowUp();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-purple-200/60 overflow-hidden max-h-[85vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900 text-sm">
                    AI Explanation
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {messages.length > 1 && (
                    <button
                      onClick={handleClearHistory}
                      className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                      title="Clear chat history"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                  {messages.length > 0 && !isLoading && (
                    <button
                      onClick={handleCopyLast}
                      className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                      title="Copy last response"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              {title && (
                <p className="text-xs text-purple-500 mt-1 truncate">{title}</p>
              )}
            </div>

            {/* Toast notification */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-14 left-4 right-4 z-10 flex items-start gap-2 px-3 py-2.5 rounded-xl border shadow-lg text-xs ${
                    toast.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">
                    {toast.message}
                  </span>
                  <button
                    onClick={() => setToast(null)}
                    className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {isLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">
                    Generating AI explanation...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This may take a few seconds
                  </p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`${
                      msg.role === 'user'
                        ? 'flex justify-end'
                        : 'flex justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-bold text-gray-800 mt-4 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              code: ({ children }) => <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                              pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs my-2">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-300 pl-3 italic text-sm text-gray-600 my-2">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline hover:text-purple-800">{children}</a>,
                              hr: () => <hr className="my-4 border-gray-200" />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-slate-400 py-6">
                  No explanation available.
                </p>
              )}

              {/* Follow-up loading indicator */}
              {followUpLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      <span className="text-sm text-slate-500">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up input */}
            {!isLoading && messages.length > 0 && (
              <div className="px-4 py-3 border-t border-purple-100 bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                    disabled={followUpLoading}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:opacity-50 transition-all"
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={!followUpInput.trim() || followUpLoading}
                    className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    title="Send follow-up"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AIResponseOverlay;
