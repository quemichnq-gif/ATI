import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { MATCH_TAGS, ZODIAC_SIGNS } from '../constants/astrologyMap';
import { apiLoveMatching, apiLoveMatchingHistory } from '../services/api';
import { MatchTagType } from '../types';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';

const TAG_ICONS: Record<MatchTagType, 'heart' | 'flame' | 'sparkles' | 'star'> = {
  greenflag: 'heart', redflag: 'flame', karmic: 'sparkles', destiny: 'star', twinflame: 'flame',
};

export default function MatchPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<MatchTagType>('greenflag');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.uid || !c.uid) return;
    const chatId = [profile.uid, c.uid].sort().join('_');
    try {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [profile.uid, c.uid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [c.uid]: c.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [c.uid]: c.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
        lastTimestamp: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.error('Error starting chat:', err);
    }
    navigate(`/chat/${chatId}`, { state: { chatName: c.name } });
  };
  const [loadedTag, setLoadedTag] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadCandidates = async (tag: MatchTagType) => {
    if (!profile.uid) return;
    setLoading(true); setError('');
    try {
      // Try cache first
      const cached = await apiLoveMatchingHistory(profile.uid, tag);
      if (cached.data?.users?.length > 0) {
        setCandidates(cached.data.users);
        setLoadedTag(tag);
        return;
      }
      // Call AI
      const res = await apiLoveMatching(tag, {
        uid: profile.uid,
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, ascendant: profile.ascendant },
      });
      setCandidates(res.data?.users || []);
      setLoadedTag(tag);
    } catch {
      setError('Không thể tải danh sách. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  const tagInfo = MATCH_TAGS[selectedTag];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="sparkles" label="Khám phá tình duyên" className="mr-2 inline" />Khám Phá Tình Duyên</h1>
        <p className="text-purple-300 opacity-70 mt-1">AI phân tích vũ trụ tìm người tương hợp với bạn</p>
      </motion.div>

      {/* Tag Selection */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4">Chọn loại kết nối</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(MATCH_TAGS).map(([tag, info]) => (
            <motion.button
              key={tag}
              aria-pressed={selectedTag === tag}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTag(tag as MatchTagType)}
              className={`p-4 rounded-xl text-center transition-all ${
                selectedTag === tag ? 'text-white' : 'glass text-purple-300 hover:text-white'
              }`}
              style={selectedTag === tag ? {
                background: `linear-gradient(135deg, ${info.color}33, ${info.color}22)`,
                border: `1px solid ${info.color}66`,
                /* Layered glow: tight + mid + outer ambient */
                boxShadow: `0 0 4px ${info.color}44, 0 0 14px ${info.color}33, 0 0 28px ${info.color}11`,
                transition: 'box-shadow 200ms ease',
              } : { transition: 'box-shadow 200ms ease' }}
            >
              <div className="text-2xl mb-1"><UiIcon name={TAG_ICONS[tag as MatchTagType]} label={info.label} /></div>
              <p className="text-sm font-semibold">{info.label}</p>
              <p className="text-xs opacity-60 mt-0.5 leading-tight">{info.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="mt-4 flex gap-3 items-center">
          <button onClick={() => loadCandidates(selectedTag)} disabled={loading}
            className="btn-cosmic px-8 py-3 flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${tagInfo.color}, ${tagInfo.color}99)` }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <><UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} className="inline" /> Tìm {tagInfo.label}</>
            )}
          </button>
          {loadedTag && loadedTag !== selectedTag && (
            <p className="text-purple-400 text-sm">Nhấn để tải kết quả cho {tagInfo.label}</p>
          )}
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card p-8 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="cosmic-spinner" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl"><UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} /></div>
            </div>
            <p className="text-white font-semibold mb-1">AI đang phân tích vũ trụ...</p>
            <p className="text-purple-300 text-sm opacity-70">Đang tìm {tagInfo.label} cho bạn</p>
          </motion.div>
        )}

        {!loading && candidates.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold">
                <UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} className="mr-1 inline" />{tagInfo.label} – {candidates.length} người
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((c, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  role="link" tabIndex={0} aria-label={`Xem hồ sơ ${c.name}`}
                  onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) navigate(`/user/${c.uid}`); }}
                  className="glass-card p-5 cursor-pointer card-hover"
                  onClick={() => navigate(`/user/${c.uid}`)}
                  style={{ border: `1px solid ${tagInfo.color}33` }}
                >
                  {/* Avatar */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                      style={{ border: `2px solid ${tagInfo.color}66` }}>
                      {c.avatar
                        ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl"
                            style={{ background: `linear-gradient(135deg, ${tagInfo.color}66, ${tagInfo.color}33)` }}>
                            {ZODIAC_SIGNS[c.sun || c.zodiac || '']
                              ? <ZodiacIcon sign={c.sun || c.zodiac} label={`Cung ${c.sun || c.zodiac}`} />
                              : c.name?.[0]}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base truncate">{c.name}</h3>
                      <p className="text-purple-300 text-sm">{ZODIAC_SIGNS[c.sun || c.zodiac || ''] && <ZodiacIcon sign={c.sun || c.zodiac} label={`Cung ${c.sun || c.zodiac}`} className="mr-1 inline" />}{c.zodiac || c.sun}</p>
                      {c.score && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="cosmic-progress flex-1 h-1.5">
                            <div className="h-full rounded" style={{ width: `${c.score}%`, background: tagInfo.color }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: tagInfo.color }}>{c.score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {c.reason && (
                    <p className="text-purple-200 text-xs leading-relaxed opacity-80 italic">"{c.reason}"</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => handleStartChat(c, e)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${tagInfo.color}66, ${tagInfo.color}44)` }}>
                      <UiIcon name="message" label="Nhắn tin" className="mr-1 inline" />Nhắn Tin
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${c.uid}`);
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white glass transition-all hover:bg-white/10">
                      <UiIcon name="user" label="Xem hồ sơ" className="mr-1 inline" />Xem Hồ Sơ
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!loading && candidates.length === 0 && loadedTag && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-10 text-center">
            <div className="text-5xl mb-4"><UiIcon name="compass" label="Chưa có kết quả phù hợp" /></div>
            <p className="text-white font-semibold mb-2">Chưa tìm thấy ai</p>
            <p className="text-purple-300 text-sm opacity-70">Vũ trụ đang chuẩn bị... Hãy thử lại sau!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
