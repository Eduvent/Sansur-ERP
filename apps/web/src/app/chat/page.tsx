'use client';

import { useState, useRef, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient } from '@/lib/api';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS = [
  'Cuantos productos tenemos en total?',
  'Que productos estan con stock bajo?',
  'Cual fue el monto de ventas de hoy?',
  'Top 5 ventiladores mas vendidos',
  'Muestra los proveedores registrados',
  'Que movimientos hubo hoy en el kardex?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let nextId = useRef(0);

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
      // Enviar historial (ultimos 10 mensajes para no gastar tokens)
      const history = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.post<{ reply: string }>('/api/chat', {
        message: text.trim(),
        history: history.slice(0, -1), // excluir el mensaje actual (ya va en message)
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

  return (
    <Shell>
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-4">Asistente IA</h1>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              Asistente SANSUR
            </h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Preguntame lo que necesites sobre tu inventario, ventas, productos o proveedores. Uso IA para consultar la base de datos en tiempo real.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-brand hover:text-white rounded-full transition-colors text-slate-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
              {' '}Consultando la base de datos...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
    </Shell>
  );
}
