import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);
  const chatName = (location.state as any)?.chatName || 'Trò chuyện';

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: profile.uid,
        senderName: profile.name,
        text,
        timestamp: serverTimestamp(),
        read: false,
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastTimestamp: Date.now(),
      });
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b mb-4" style={{ borderColor: 'rgba(157,78,221,0.2)' }}>
        <button onClick={() => navigate('/chat')}
          className="text-purple-300 hover:text-white transition-colors text-xl">←</button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #9d4edd, #ff6eb4)' }}>
          {chatName[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-white font-semibold">{chatName}</h2>
          <p className="text-purple-300 text-xs opacity-60">Kết nối vũ trụ ✨</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMine = msg.senderId === profile.uid;
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={isMine ? 'message-sent' : 'message-received'}>
                  {!isMine && (
                    <p className="text-purple-300 text-xs mb-1 font-medium">{msg.senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-purple-200 opacity-60 text-right' : 'text-purple-400 opacity-60'}`}>
                    {msg.timestamp?.seconds ? formatTimestamp(msg.timestamp.seconds * 1000) : 'Vừa xong'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            className="cosmic-input resize-none pr-12"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>
        <button onClick={handleSend} disabled={!input.trim() || sending}
          className="btn-cosmic px-5 py-3 flex-shrink-0 disabled:opacity-40"
          style={{ height: '48px' }}>
          {sending ? '⏳' : '💬'}
        </button>
      </div>
    </div>
  );
}
