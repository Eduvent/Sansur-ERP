'use client';

import { useState, useRef, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_STORAGE_KEY_PREFIX = 'sansur.chat.messages.v1';
const MAX_STORED_MESSAGES = 30;

const SUGGESTIONS = [
  '¿Cuántos productos tenemos en total?',
  '¿Qué productos están con stock bajo?',
  '¿Cuál fue el monto de ventas de hoy?',
  'Top 5 ventiladores más vendidos',
  'Muestra los proveedores registrados',
  '¿Qué movimientos hubo hoy en el kárdex?',
];

function readStoredMessages(storageKey: string): Message[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((message): message is Message => (
      typeof message?.id === 'number' &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string'
    ));
  } catch {
    return [];
  }
}

function saveStoredMessages(storageKey: string, messages: Message[]) {
  if (typeof window === 'undefined') return;

  try {
    if (messages.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
    );
  } catch {
    // Si el navegador bloquea localStorage, el chat sigue funcionando en memoria.
  }
}

function FanMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="currentColor">
        <circle cx="32" cy="32" r="3.2" />
        <path d="M32 30c-2 0-3.5-1-4.5-3-3-6-2-13 4-17.5.6-.5 1.4-.2 1.6.6 1.5 7 .5 13.5-1 18-.2.8-.5 1.5-.8 1.9z" opacity="0.92" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.78" transform="rotate(72 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.62" transform="rotate(144 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.48" transform="rotate(216 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.34" transform="rotate(288 32 32)" />
      </g>
    </svg>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const chatStorageKey = user ? `${CHAT_STORAGE_KEY_PREFIX}:${user.id}` : null;

  useEffect(() => {
    if (!chatStorageKey) {
      setMessages([]);
      setActiveStorageKey(null);
      nextId.current = 0;
      return;
    }

    const storedMessages = readStoredMessages(chatStorageKey);
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      nextId.current = Math.max(...storedMessages.map((message) => message.id)) + 1;
    } else {
      setMessages([]);
      nextId.current = 0;
    }
    setActiveStorageKey(chatStorageKey);
  }, [chatStorageKey]);

  useEffect(() => {
    if (!activeStorageKey || activeStorageKey !== chatStorageKey) return;
    saveStoredMessages(activeStorageKey, messages);
  }, [messages, activeStorageKey, chatStorageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: nextId.current++, role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const history = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.post<{ reply: string }>('/api/chat', {
        message: text.trim(),
        history: history.slice(0, -1),
      });

      const assistantMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: res.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'No se pudo conectar con el asistente'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function clearChat() {
    setMessages([]);
    nextId.current = 0;
    if (activeStorageKey) saveStoredMessages(activeStorageKey, []);
    inputRef.current?.focus();
  }

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-14rem)]">
        <header className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <span className="eyebrow">Sección VII · Asistente</span>
            <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
              Lenguaje natural · consultas a la base
            </span>
          </div>
          <div className="double-rule">
            <h1 className="font-display text-[64px] leading-[0.95] tracking-tight text-ink py-1">
              Pregúntele <span className="italic text-ember">al sistema.</span>
            </h1>
          </div>
          {messages.length > 0 && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={clearChat}
                className="btn-secondary py-2"
              >
                Limpiar conversación
              </button>
            </div>
          )}
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto border border-ink/15 bg-paper-50 p-8 relative">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <FanMark className="w-16 h-16 text-ink mb-6 animate-spin-slow" />
              <h2 className="font-display text-4xl text-ink mb-2 leading-none">
                Hola — ¿qué <span className="italic text-ember">quieres saber?</span>
              </h2>
              <p className="font-display italic text-lg text-ink-500 max-w-md mt-3 leading-snug">
                Pregúntame en español sobre inventario, ventas, productos o proveedores.
                Consulto la base en tiempo real.
              </p>

              <div className="dotted-rule w-32 my-7" />

              <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-4">
                Sugerencias
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="tag hover:bg-ink hover:text-paper hover:border-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={msg.id} className="animate-rise-in">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className={`text-[10px] uppercase tracking-widest2 ${
                    msg.role === 'user' ? 'text-ember' : 'text-cobalt'
                  }`}>
                    {msg.role === 'user' ? '› Tú' : '— Asistente'}
                  </span>
                  <span className="mono-num text-[10px] text-ink-300">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 h-px bg-ink/10" />
                </div>
                <div
                  className={`font-display text-2xl leading-snug whitespace-pre-wrap ${
                    msg.role === 'user' ? 'text-ink' : 'text-ink'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="not-italic font-medium font-sans text-ember">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            ))}

            {loading && (
              <div className="animate-rise-in">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="text-[10px] uppercase tracking-widest2 text-cobalt">
                    — Asistente
                  </span>
                  <div className="flex-1 h-px bg-ink/10" />
                </div>
                <div className="flex items-center gap-3">
                  <FanMark className="w-5 h-5 text-cobalt animate-spin-slow" />
                  <span className="font-display italic text-xl text-ink-500">
                    consultando la base
                    <span className="inline-block animate-ticker ml-1">…</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-3 items-center border border-ink/30 bg-paper-50 px-4 py-2">
          <span className="text-ember text-xl font-display italic">›</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe una pregunta..."
            disabled={loading}
            className="flex-1 bg-transparent text-lg font-display py-2 focus:outline-none placeholder:italic placeholder:text-ink-300"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary py-2.5"
          >
            Enviar →
          </button>
        </form>
      </div>
    </Shell>
  );
}
