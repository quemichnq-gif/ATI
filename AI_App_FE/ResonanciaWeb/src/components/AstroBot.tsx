import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../services/firebase';

// @ts-ignore
import logoImg from '../assets/astrogpt/Logo.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ type: string; route: string; label: string }>;
}

interface AstroBotProps {
  onClose: () => void;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function AstroBot({ onClose }: AstroBotProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý chiêm tinh của Resonancia ✨\nHãy hỏi tôi bất cứ điều gì về chiêm tinh học, cung hoàng đạo, vận hạn hay tình duyên của bạn!',
    },
  ]);

  const scrollBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const handleSend = async () => {
    const text = inputRef.current?.value.trim();
    if (!text || loading) return;
    if (inputRef.current) inputRef.current.value = '';

    const newHistory: Message[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setLoading(true);
    scrollBottom();

    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${BASE_URL}/astrology-chat`,
        {
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          userData: {
            name: user?.displayName || 'Bạn',
          },
        },
        { headers, timeout: 40000 }
      );

      const answer: string = res.data?.answer || res.data?.prediction || 'Rất tiếc, không nhận được phản hồi từ AI.';
      const backendActions = res.data?.actions || (res.data?.action ? [res.data.action] : []);
      setHistory(h => [...h, { role: 'assistant', content: answer, actions: backendActions }]);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Không thể kết nối backend. Hãy kiểm tra server Python đã chạy chưa.';
      setHistory(h => [...h, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
      scrollBottom();
    }
  };

  return (
    /* Panel nổi — desktop: góc phải dưới; mobile: toàn màn hình */
    <div
      className="astrica-ai-panel fixed z-50 md:bottom-24 md:right-6 md:w-96 md:h-[520px]
                 inset-0 md:inset-auto flex flex-col
                 rounded-none md:rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(11, 6, 22, 0.97)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        boxShadow: '0 0 40px rgba(168,85,247,0.25), 0 24px 64px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(219,39,119,0.35))',
          borderBottom: '1px solid rgba(168,85,247,0.25)',
        }}
      >
        <img src={logoImg} alt="Resonancia AI" className="w-9 h-9 rounded-xl object-cover" />
        <div className="flex-1">
          <p className="text-sm font-bold text-purple-100 uppercase tracking-wider leading-tight">
            RESONANCIA AI
          </p>
          <p className="text-[10px] text-purple-300/60 font-mono tracking-widest">
            Trợ Lý Chiêm Tinh Học Thông Minh
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Đóng AstroBot"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'rounded-br-sm text-white'
                  : 'rounded-bl-sm text-purple-100'
              }`}
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(219,39,119,0.5))',
                border: '1px solid rgba(168,85,247,0.3)',
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(168,85,247,0.15)',
              }}
            >
              {msg.content}
              {Boolean(msg.actions?.length) && (
                <div className="mt-2 pt-2 border-t border-purple-500/20 flex flex-wrap gap-1.5">
                  {msg.actions?.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      type="button"
                      onClick={() => {
                        navigate(act.route);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{act.label}</span>
                      <span>&rarr;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}
            >
              {[0,1,2].map(j => (
                <span
                  key={j}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70"
                  style={{ animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid rgba(168,85,247,0.15)' }}
      >
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Hỏi bất cứ điều gì về chiêm tinh..."
            disabled={loading}
            className="flex-1 rounded-full px-4 py-2 text-sm text-purple-100 placeholder-purple-400/50 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.6)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,0.3)')}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              border: '1px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 10px rgba(168,85,247,0.3)',
            }}
            aria-label="Gửi"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

