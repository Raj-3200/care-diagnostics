'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, X, RotateCcw, Sparkles, User, Loader2, ChevronDown,
  ArrowLeft, XCircle, Shield, AlertTriangle, CheckCircle2, Info,
  Compass, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { ApiResponse } from '@/types';

// ════════════════════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface ConversationState {
  intent: string | null;
  currentStep: number;
  totalSteps: number;
  payload: Record<string, unknown>;
  awaitingConfirmation: boolean;
  completed: boolean;
  stepLabels: string[];
}

type MessageType = 'system' | 'step' | 'validation_error' | 'confirmation' | 'result' | 'info' | 'error' | 'navigation';

interface AiChatResponse {
  message: string;
  conversationId: string;
  state: ConversationState;
  suggestions?: string[];
  messageType: MessageType;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  state?: ConversationState;
  messageType?: MessageType;
}

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const INTENT_LABELS: Record<string, string> = {
  CREATE_PATIENT: 'Patient Registration',
  CREATE_VISIT: 'Visit Creation',
  ADD_TESTS: 'Add Test Orders',
  GENERATE_INVOICE: 'Invoice Generation',
  CHECK_REPORT_STATUS: 'Report Status',
  SEARCH_PATIENT: 'Patient Search',
  SEARCH_VISIT: 'Visit Search',
};

// ════════════════════════════════════════════════════════════════════════════════
//  MARKDOWN RENDERER — Structured enterprise output
// ════════════════════════════════════════════════════════════════════════════════

function renderInlineMarkdown(text: string) {
  // Bold, italic, and inline code
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_') && !part.startsWith('__')) {
      return <em key={i} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ content, messageType }: { content: string; messageType?: MessageType }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return <div key={i} className="h-1.5" />;

        // Success icon line
        if (trimmedLine.startsWith('✅')) {
          return (
            <div key={i} className="flex gap-2 items-start text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{renderInlineMarkdown(trimmedLine.slice(2).trim())}</span>
            </div>
          );
        }

        // Error icon line
        if (trimmedLine.startsWith('❌')) {
          return (
            <div key={i} className="flex gap-2 items-start text-red-700 font-medium">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{renderInlineMarkdown(trimmedLine.slice(2).trim())}</span>
            </div>
          );
        }

        // Warning icon line
        if (trimmedLine.startsWith('⚠️')) {
          return (
            <div key={i} className="flex gap-2 items-start text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-1">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-[12px]">{renderInlineMarkdown(trimmedLine.slice(2).trim())}</span>
            </div>
          );
        }

        // Navigation arrow
        if (trimmedLine.startsWith('→')) {
          return (
            <div key={i} className="flex gap-2 items-center pl-1 text-primary font-medium">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>{renderInlineMarkdown(trimmedLine.slice(1).trim())}</span>
            </div>
          );
        }

        // Bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{renderInlineMarkdown(trimmedLine.replace(/^[•-]\s*/, ''))}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\./.test(trimmedLine)) {
          const match = trimmedLine.match(/^(\d+\.)\s*(.*)/);
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-muted-foreground font-medium min-w-[1.25rem]">{match?.[1]}</span>
              <span>{renderInlineMarkdown(match?.[2] || '')}</span>
            </div>
          );
        }

        // Regular text
        return <div key={i}>{renderInlineMarkdown(line)}</div>;
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  STEP PROGRESS BAR — Enterprise workflow tracker
// ════════════════════════════════════════════════════════════════════════════════

function StepProgressBar({
  currentStep,
  totalSteps,
  intent,
  awaitingConfirmation,
  stepLabels,
}: {
  currentStep: number;
  totalSteps: number;
  intent: string;
  awaitingConfirmation: boolean;
  stepLabels: string[];
}) {
  const taskLabel = INTENT_LABELS[intent] || intent;
  const displayStep = awaitingConfirmation ? totalSteps : currentStep;
  const progress = totalSteps > 0 ? (displayStep / (totalSteps + 1)) * 100 : 0;
  const confirmProgress = awaitingConfirmation ? ((totalSteps + 1) / (totalSteps + 1)) * 100 : progress;

  return (
    <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.03] to-transparent">
      {/* Task header */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wide">{taskLabel}</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {awaitingConfirmation ? 'Review & Confirm' : `Step ${currentStep + 1} of ${totalSteps}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              awaitingConfirmation ? 'bg-amber-500' : 'bg-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${awaitingConfirmation ? confirmProgress : progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step labels (dots) */}
      <div className="flex items-center gap-1 px-4 pb-2.5 overflow-x-auto">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              'h-2 w-2 rounded-full transition-colors',
              idx < currentStep ? 'bg-primary' :
              idx === currentStep && !awaitingConfirmation ? 'bg-primary ring-2 ring-primary/30' :
              'bg-muted-foreground/20'
            )} />
            <span className={cn(
              'text-[9px] font-medium',
              idx < currentStep ? 'text-primary' :
              idx === currentStep && !awaitingConfirmation ? 'text-foreground' :
              'text-muted-foreground/50'
            )}>
              {label}
            </span>
            {idx < stepLabels.length - 1 && <div className="w-2 h-px bg-muted-foreground/15 mx-0.5" />}
          </div>
        ))}
        {/* Confirmation dot */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2 h-px bg-muted-foreground/15 mx-0.5" />
          <div className={cn(
            'h-2 w-2 rounded-full transition-colors',
            awaitingConfirmation ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-muted-foreground/20'
          )} />
          <span className={cn(
            'text-[9px] font-medium',
            awaitingConfirmation ? 'text-amber-700' : 'text-muted-foreground/50'
          )}>
            Confirm
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MESSAGE TYPE INDICATOR — Visual cue for message purpose
// ════════════════════════════════════════════════════════════════════════════════

function MessageTypeIndicator({ type }: { type?: MessageType }) {
  if (!type || type === 'info' || type === 'system') return null;

  const configs: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    step: { icon: <ClipboardList className="h-3 w-3" />, label: 'Data Collection', className: 'bg-primary/10 text-primary' },
    validation_error: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Validation', className: 'bg-red-50 text-red-700' },
    confirmation: { icon: <Shield className="h-3 w-3" />, label: 'Confirmation Required', className: 'bg-amber-50 text-amber-700' },
    result: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Result', className: 'bg-emerald-50 text-emerald-700' },
    error: { icon: <XCircle className="h-3 w-3" />, label: 'Error', className: 'bg-red-50 text-red-700' },
    navigation: { icon: <Compass className="h-3 w-3" />, label: 'Navigation', className: 'bg-blue-50 text-blue-700' },
  };

  const config = configs[type];
  if (!config) return null;

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider mb-1.5', config.className)}>
      {config.icon}
      {config.label}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

export function AiAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activeState, setActiveState] = useState<ConversationState | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Welcome message — enterprise tone
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: [
          '**Care Diagnostics LIMS — System Operator**',
          '',
          `Logged in as **${user?.firstName || 'User'}** (${user?.role || 'USER'}). This system performs guided operations and answers LIMS-specific questions only.`,
          '',
          '**Available Actions:**',
          '• **Register a patient** — Guided registration with full validation',
          '• **Create a visit** — Open a new patient visit',
          '• **Add tests** — Order laboratory tests for a visit',
          '• **Generate invoice** — Create a billing invoice',
          '• **Search patient** — Look up patient records',
          '• **Search visit** — Find visit records',
          '• **Check report status** — Track report progress',
          '• **Go to [section]** — Navigate to any system module',
          '',
          'All write operations require explicit confirmation. No action is taken without your approval.',
          '',
          'State your request to begin.',
        ].join('\n'),
        timestamp: new Date(),
        suggestions: ['Register a patient', 'Create a visit', 'Search patient', 'Check report status'],
        messageType: 'system',
      }]);
    }
  }, [isOpen, messages.length, user?.firstName]);

  // Focus input
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post<ApiResponse<AiChatResponse>>('/ai/chat', {
        message: messageText,
        ...(conversationId ? { conversationId } : {}),
      });

      if (data.success && data.data) {
        const response = data.data;
        setConversationId(response.conversationId);
        setActiveState(response.state);

        // Handle navigation
        const routeMatch = response.message.match(/→\s*\*\*([^*]+)\*\*/);
        if (routeMatch) {
          const routeMap: Record<string, string> = {
            '/dashboard': '/dashboard',
            '/dashboard/patients': '/dashboard/patients',
            '/dashboard/visits': '/dashboard/visits',
            '/dashboard/tests': '/dashboard/tests',
            '/dashboard/test-orders': '/dashboard/test-orders',
            '/dashboard/samples': '/dashboard/samples',
            '/dashboard/results': '/dashboard/results',
            '/dashboard/reports': '/dashboard/reports',
            '/dashboard/invoices': '/dashboard/invoices',
            '/dashboard/users': '/dashboard/users',
          };
          const routePath = routeMatch[1];
          if (routeMap[routePath]) {
            setTimeout(() => router.push(routeMap[routePath]), 600);
          }
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          suggestions: response.suggestions,
          state: response.state,
          messageType: response.messageType,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errMsg = getErrorMessage(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `An error occurred: ${errMsg}. Please try again.`,
          timestamp: new Date(),
          messageType: 'error' as MessageType,
        },
      ]);
      setActiveState(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const resetChat = async () => {
    if (conversationId) {
      try { await api.post('/ai/reset', { conversationId }); } catch { /* ignore */ }
    }
    setMessages([]);
    setConversationId(null);
    setActiveState(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollBtn(target.scrollHeight - target.scrollTop - target.clientHeight > 100);
  };

  // ─── Computed state ────────────────────────────────────────────────────────
  const isInWorkflow = !!(activeState?.intent && activeState.totalSteps > 0 && !activeState.completed);
  const isConfirmStep = !!(activeState?.awaitingConfirmation);

  return (
    <>
      {/* ═══ Floating Trigger Button ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Chat Panel ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex h-[640px] w-[440px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-white shadow-2xl"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('h-1.5 w-1.5 rounded-full', isInWorkflow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {isInWorkflow ? 'Workflow Active' : 'Ready'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetChat}
                  className="text-muted-foreground hover:text-foreground"
                  title="Reset conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ─── Step Progress Bar ─── */}
            {isInWorkflow && activeState?.intent && (
              <StepProgressBar
                currentStep={activeState.currentStep}
                totalSteps={activeState.totalSteps}
                intent={activeState.intent}
                awaitingConfirmation={activeState.awaitingConfirmation}
                stepLabels={activeState.stepLabels || []}
              />
            )}

            {/* ─── Messages ─── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
              onScroll={handleScroll}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}>
                    {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                    msg.role === 'assistant' ? 'bg-muted/50 text-foreground border border-border/30' : 'bg-primary text-primary-foreground',
                  )}>
                    {/* Message type indicator */}
                    {msg.role === 'assistant' && <MessageTypeIndicator type={msg.messageType} />}

                    <MessageContent content={msg.content} messageType={msg.messageType} />

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            disabled={isLoading}
                            className="inline-flex items-center rounded-lg border border-primary/20 bg-white px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 hover:border-primary/40 transition-all disabled:opacity-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-xl bg-muted/50 border border-border/30 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-[11px] text-muted-foreground font-medium">Processing...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─── Scroll to bottom ─── */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-[100px] left-1/2 -translate-x-1/2"
                >
                  <Button variant="secondary" size="xs" onClick={scrollToBottom} className="rounded-full shadow-md">
                    <ChevronDown className="h-3 w-3 mr-1" />
                    New messages
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Input Area ─── */}
            <div className="border-t border-border/50 bg-white p-3">
              {/* Workflow action buttons */}
              {isInWorkflow && (
                <div className="flex items-center gap-2 mb-2">
                  {isConfirmStep ? (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => sendMessage('Yes')}
                        disabled={isLoading}
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 font-medium"
                      >
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Confirm & Execute
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage('No')}
                        disabled={isLoading}
                        className="flex-1 h-8 text-xs font-medium"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                        Start Over
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendMessage('cancel')}
                      disabled={isLoading}
                      className="h-7 text-[11px] text-muted-foreground hover:text-destructive font-medium"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Cancel Task
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isConfirmStep
                        ? 'Type Yes to confirm or No to restart...'
                        : isInWorkflow
                          ? 'Enter the requested information...'
                          : 'State your request or ask a LIMS question...'
                    }
                    rows={1}
                    className="w-full resize-none rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    style={{ maxHeight: '80px' }}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Footer */}
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <Info className="h-3 w-3 text-muted-foreground/40" />
                <p className="text-[10px] text-muted-foreground/50 font-medium">
                  LIMS System Operator — Guided workflows only
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
