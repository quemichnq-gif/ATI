import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';

interface JournalEntry {
  id: string;
  date: string;
  energy: 'high' | 'medium' | 'low';
  mood: string;
  note: string;
  lunarPhase?: string;
  createdAt: number;
}

const MOODS = [
  { emoji: '🌟', label: 'Rực rỡ', value: 'radiant' },
  { emoji: '😊', label: 'Thoải mái', value: 'calm' },
  { emoji: '💭', label: 'Suy nghĩ nhiều', value: 'thoughtful' },
  { emoji: '🌊', label: 'Cảm xúc dâng', value: 'emotional' },
  { emoji: '⚡', label: 'Năng lượng cao', value: 'energetic' },
  { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
  { emoji: '🌙', label: 'Trầm lắng', value: 'introspective' },
  { emoji: '🔥', label: 'Quyết đoán', value: 'decisive' },
];

const ENERGY_COLORS = { high: '#4ade80', medium: '#fbbf24', low: '#f87171' };
const ENERGY_LABELS = { high: 'Cao', medium: 'Vừa', low: 'Thấp' };

export default function CosmicJournalPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    energy: 'medium' as 'high' | 'medium' | 'low',
    mood: '',
    note: '',
  });

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);

  useEffect(() => {
    if (!profile.uid) return;
    loadEntries();
  }, [profile.uid]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'cosmic_journals', profile.uid!, 'entries'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
      setEntries(data);
    } catch (err) {
      // Fallback: in-memory
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.mood || !profile.uid) return;
    setSaving(true);
    const entryId = today;
    const entry: JournalEntry = {
      id: entryId,
      date: today,
      energy: form.energy,
      mood: form.mood,
      note: form.note.trim(),
      createdAt: Date.now(),
    };
    try {
      await setDoc(
        doc(db, 'cosmic_journals', profile.uid, 'entries', entryId),
        entry
      );
    } catch { /* ignore */ }
    setEntries(prev => [entry, ...prev.filter(e => e.id !== entryId)]);
    setWriting(false);
    setForm({ energy: 'medium', mood: '', note: '' });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile.uid) return;
    try {
      await deleteDoc(doc(db, 'cosmic_journals', profile.uid, 'entries', id));
    } catch { /* ignore */ }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getMoodEmoji = (moodValue: string) => MOODS.find(m => m.value === moodValue)?.emoji || '✦';
  const getMoodLabel = (moodValue: string) => MOODS.find(m => m.value === moodValue)?.label || moodValue;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm">← Về Trang Chủ</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">📝 Nhật Ký Vũ Trụ</h1>
        <p className="text-purple-300 opacity-70 mt-1">Ghi lại cảm xúc và năng lượng theo hành trình của các vì sao</p>
      </motion.div>

      {/* Today's entry / write button */}
      {!writing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {todayEntry ? (
            <div className="glass-card p-4" style={{ border: `1px solid ${colors[0]}30` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getMoodEmoji(todayEntry.mood)}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Hôm nay — {getMoodLabel(todayEntry.mood)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${ENERGY_COLORS[todayEntry.energy]}20`, color: ENERGY_COLORS[todayEntry.energy] }}>
                        Năng lượng {ENERGY_LABELS[todayEntry.energy]}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(todayEntry.id)}
                  className="text-purple-500 hover:text-red-400 text-sm transition-colors">✕</button>
              </div>
              {todayEntry.note && (
                <p className="text-purple-200 text-xs mt-3 opacity-80 italic border-l-2 pl-3 leading-relaxed"
                  style={{ borderColor: colors[0] }}>
                  {todayEntry.note}
                </p>
              )}
            </div>
          ) : (
            <button onClick={() => setWriting(true)}
              className="w-full glass-card p-5 text-center hover:border-purple-400/30 transition-all"
              style={{ border: `1px dashed ${colors[0]}40` }}>
              <div className="text-3xl mb-2">✍️</div>
              <p className="text-white font-semibold">Ghi Nhật Ký Hôm Nay</p>
              <p className="text-purple-300 text-xs opacity-60 mt-1">Hôm nay bạn cảm thấy thế nào?</p>
            </button>
          )}
        </motion.div>
      ) : (
        /* Write form */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
          <h2 className="text-white font-semibold">✍️ Nhật Ký Hôm Nay</h2>

          {/* Energy level */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Mức năng lượng hôm nay</p>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, energy: e }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${form.energy === e ? 'text-white' : 'glass text-purple-300'}`}
                  style={form.energy === e ? { background: `${ENERGY_COLORS[e]}30`, border: `1px solid ${ENERGY_COLORS[e]}60`, color: ENERGY_COLORS[e] } : {}}>
                  {ENERGY_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Trạng thái cảm xúc</p>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  className={`p-2 rounded-xl text-center transition-all ${form.mood === m.value ? 'ring-1' : 'glass opacity-60 hover:opacity-100'}`}
                  style={form.mood === m.value ? { background: `${colors[0]}20`, borderColor: colors[0], boxShadow: `0 0 0 1px ${colors[0]}` } : {}}>
                  <div className="text-xl">{m.emoji}</div>
                  <div className="text-purple-300 text-xs mt-0.5">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Ghi chú thêm (tùy chọn)</p>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Hôm nay điều gì đặc biệt xảy ra? Bạn cảm nhận được điều gì từ vũ trụ?..."
              rows={3}
              className="w-full glass px-3 py-2 rounded-xl text-white text-sm placeholder-purple-400/50 outline-none border border-purple-500/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setWriting(false)}
              className="flex-1 glass py-2.5 rounded-xl text-purple-300 text-sm">Hủy</button>
            <button onClick={handleSave} disabled={!form.mood || saving}
              className="flex-2 btn-cosmic px-6 py-2.5 disabled:opacity-50 text-sm"
              style={{ background: form.mood ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` : undefined }}>
              {saving ? 'Đang lưu...' : '✓ Lưu Nhật Ký'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Past entries timeline */}
      {!loading && entries.filter(e => e.date !== today).length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>📅</span> Hành Trình Năng Lượng
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {entries.filter(e => e.date !== today).slice(0, 14).map((entry, i) => (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3 items-start glass-card p-3"
                >
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                    <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                    <div className="w-1 h-1 rounded-full" style={{ background: ENERGY_COLORS[entry.energy] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-xs font-medium">
                        {new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <span className="text-xs" style={{ color: ENERGY_COLORS[entry.energy] }}>
                        ⚡ {ENERGY_LABELS[entry.energy]}
                      </span>
                    </div>
                    <p className="text-purple-300 text-xs opacity-70">{getMoodLabel(entry.mood)}</p>
                    {entry.note && (
                      <p className="text-purple-200 text-xs mt-1 opacity-80 italic truncate">{entry.note}</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(entry.id)}
                    className="text-purple-600 hover:text-red-400 text-xs transition-colors flex-shrink-0">✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && !writing && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">🌌</div>
          <p className="text-white font-semibold">Chưa có nhật ký nào</p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">Bắt đầu ghi lại hành trình năng lượng của bạn hôm nay!</p>
        </div>
      )}
    </div>
  );
}
