import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import UiIcon from '../components/UiIcon';

export default function ChatListPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.uid) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', profile.uid),
      orderBy('lastTimestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [profile.uid]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="message" label="Trò chuyện" className="mr-2 inline" />Trò Chuyện</h1>
        <p className="text-purple-300 opacity-70 mt-1">{chats.length} cuộc trò chuyện</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-purple-800/40" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-purple-800/40 rounded w-1/3" />
                <div className="h-3 bg-purple-800/20 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4"><UiIcon name="mail" label="Chưa có cuộc trò chuyện" /></div>
          <p className="text-white font-semibold mb-2">Chưa có cuộc trò chuyện nào</p>
          <p className="text-purple-300 text-sm opacity-70 mb-4">Kết nối với người tương hợp để bắt đầu!</p>
          <button onClick={() => navigate('/match')} className="btn-cosmic px-6 py-2.5 text-sm">
            <UiIcon name="search" label="Tìm người tương hợp" className="mr-2 inline" />Tìm Người Tương Hợp
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat, i) => {
            const otherUid = chat.participants?.find((p: string) => p !== profile.uid);
            const otherName = chat.participantNames?.[otherUid] || 'Người dùng';
            const otherAvatar = chat.participantAvatars?.[otherUid];
            return (
              <motion.div key={chat.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
                role="link" tabIndex={0} aria-label={`Mở cuộc trò chuyện với ${otherName}`}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/chat/${chat.id}`, { state: { chatName: otherName } }); }}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer card-hover"
                onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: otherName } })}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid rgba(157,78,221,0.4)' }}>
                    {otherAvatar
                      ? <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                          style={{ background: 'linear-gradient(135deg, #9d4edd, #ff6eb4)' }}>
                          {otherName[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="notification-badge">{chat.unreadCount}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-semibold truncate">{otherName}</h3>
                    <span className="text-purple-400 text-xs flex-shrink-0 ml-2">
                      {chat.lastTimestamp ? formatTimestamp(chat.lastTimestamp) : ''}
                    </span>
                  </div>
                  <p className="text-purple-300 text-sm truncate opacity-70 mt-0.5">
                    {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
