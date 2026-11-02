import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, collection, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    energy: 'medium' as 'high' | 'medium' | 'low',
    mood: 'radiant',
    note: '',
  });

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

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
    } catch {
      // Fallback: in-memory
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (dateStr?: string) => {
    setEditingId(null);
    setForm({
      date: dateStr || today,
      energy: 'medium',
      mood: 'radiant',
      note: '',
    });
    setWriting(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      energy: entry.energy,
      mood: entry.mood,
      note: entry.note || '',
    });
    setWriting(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.mood) return;
    setSaving(true);
    const entryId = editingId || form.date || today;
    const entry: JournalEntry = {
      id: entryId,
      date: form.date || today,
      energy: form.energy,
      mood: form.mood,
      note: form.note.trim(),
      createdAt: Date.now(),
    };

    if (profile.uid) {
      try {
        await setDoc(
          doc(db, 'cosmic_journals', profile.uid, 'entries', entryId),
          entry
        );
      } catch {
        /* ignore */
      }
    }

    setEntries(prev => [entry, ...prev.filter(e => e.id !== entryId)]);
    setWriting(false);
    setEditingId(null);
    setForm({ date: today, energy: 'medium', mood: 'radiant', note: '' });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (profile.uid) {
      try {
        await deleteDoc(doc(db, 'cosmic_journals', profile.uid, 'entries', id));
      } catch {
        /* ignore */
      }
    }
    setEntries(prev => prev.filter(e => e.id !== id));
    if (editingId === id) {
      setWriting(false);
      setEditingId(null);
    }
  };

  const getMoodEmoji = (moodValue: string) => MOODS.find(m => m.value === moodValue)?.emoji || '✦';
  const getMoodLabel = (moodValue: string) => MOODS.find(m => m.value === moodValue)?.label || moodValue;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm transition-colors">
        ← Về Trang Chủ
      </button>

      {/* Header with Prominent Add Journal CTA */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text font-display flex items-center gap-2">
            <UiIcon name="sparkles" label="Nhật Ký Vũ Trụ" className="text-yellow-400" />
            Nhật Ký Vũ Trụ
          </h1>
          <p className="text-purple-300 opacity-75 mt-1 text-sm">
            Ghi lại cảm xúc, mức năng lượng và chiêm nghiệm theo hành trình các vì sao
          </p>
        </div>

        {/* NÚT THÊM NHẬT KÝ NỔI BẬT */}
        {!writing && (
          <button
            onClick={() => openCreate()}
            className="btn-cosmic px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
          >
            <span>+</span>
            <span>Viết Nhật Ký Mới</span>
          </button>
        )}
      </motion.div>

      {/* Write/Edit Form */}
      {writing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-5 border border-purple-500/40 shadow-2xl"
          style={{ background: 'rgba(26, 16, 60, 0.75)' }}
        >
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <UiIcon name="sparkles" label="Soạn thảo" className="text-purple-400" />
              {editingId ? 'Chỉnh Sửa Nhật Ký' : 'Ghi Nhật Ký Vũ Trụ'}
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="journal-date" className="text-xs text-purple-300/80">Ngày:</label>
              <input
                id="journal-date"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="glass px-2.5 py-1 rounded-lg text-white text-xs border border-purple-500/30 outline-none"
              />
            </div>
          </div>

          {/* Energy level */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Mức năng lượng trong ngày</p>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, energy: e }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    form.energy === e ? 'text-white shadow-md' : 'glass text-purple-300/70 hover:text-white'
                  }`}
                  style={form.energy === e ? { background: `${ENERGY_COLORS[e]}35`, border: `1px solid ${ENERGY_COLORS[e]}`, color: ENERGY_COLORS[e] } : {}}
                >
                  {ENERGY_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Tâm trạng & Cảm xúc chủ đạo</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  className={`p-2.5 rounded-xl text-center transition-all flex items-center gap-2 ${
                    form.mood === m.value
                      ? 'bg-purple-600/40 border border-purple-400 shadow-md ring-1 ring-purple-400'
                      : 'glass opacity-70 hover:opacity-100 hover:border-purple-400/30'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="text-left">
                    <p className="text-white text-xs font-medium">{m.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-purple-300 text-xs mb-2 font-medium">Chiêm nghiệm & Ghi chú cảm xúc</p>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Hôm nay có điều gì đặc biệt xảy ra? Bạn cảm nhận thấy thông điệp gì từ các vì sao?..."
              rows={4}
              className="w-full glass px-4 py-3 rounded-xl text-white text-sm placeholder-purple-400/50 outline-none border border-purple-500/25 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-2 border-t border-purple-500/15">
            <button
              type="button"
              onClick={() => { setWriting(false); setEditingId(null); }}
              className="px-5 py-2.5 glass rounded-xl text-purple-300 text-sm hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.mood || saving}
              className="btn-cosmic px-7 py-2.5 disabled:opacity-50 text-sm font-semibold shadow-md"
              style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
            >
              {saving ? 'Đang lưu...' : editingId ? '✓ Cập Nhật Nhật Ký' : '✓ Lưu Nhật Ký'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Nhật ký hôm nay (nếu đã có và không đang soạn thảo) */}
      {!writing && todayEntry && (
        <div className="glass-card p-5 relative overflow-hidden" style={{ border: `1px solid ${colors[0]}45` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="text-4xl p-2 rounded-2xl glass bg-purple-900/30">{getMoodEmoji(todayEntry.mood)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    Hôm nay
                  </span>
                  <p className="text-white font-bold text-base">{getMoodLabel(todayEntry.mood)}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: `${ENERGY_COLORS[todayEntry.energy]}25`, color: ENERGY_COLORS[todayEntry.energy] }}
                  >
                    ● Năng lượng {ENERGY_LABELS[todayEntry.energy]}
                  </span>
                  <span className="text-[11px] text-purple-300/60 font-mono">
                    {todayEntry.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút Sửa & Xóa cho Nhật Ký Hôm Nay */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openEdit(todayEntry)}
                className="text-xs px-3 py-1.5 rounded-lg glass text-purple-200 hover:text-white hover:bg-purple-600/30 transition-all flex items-center gap-1"
                title="Chỉnh sửa nhật ký hôm nay"
              >
                <span>✎</span>
                <span>Chỉnh Sửa</span>
              </button>
              <button
                onClick={() => handleDelete(todayEntry.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg glass text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                title="Xóa nhật ký này"
              >
                ✕
              </button>
            </div>
          </div>

          {todayEntry.note && (
            <p className="text-purple-100 text-xs mt-3.5 opacity-90 italic border-l-2 pl-3.5 leading-relaxed bg-purple-950/20 p-2.5 rounded-r-xl"
              style={{ borderColor: colors[0] }}>
              "{todayEntry.note}"
            </p>
          )}
        </div>
      )}

      {/* Hành trình năng lượng quá khứ */}
      {!loading && entries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <UiIcon name="chart" label="Lịch sử" className="text-purple-400" />
            Lịch Sử Hành Trình Năng Lượng
          </h2>

          <div className="space-y-2.5">
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 items-center justify-between glass-card p-3.5 hover:border-purple-400/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{getMoodEmoji(entry.mood)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-xs font-semibold">
                          {new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${ENERGY_COLORS[entry.energy]}20`, color: ENERGY_COLORS[entry.energy] }}
                        >
                          {ENERGY_LABELS[entry.energy]}
                        </span>
                        <span className="text-purple-300 text-xs opacity-75">{getMoodLabel(entry.mood)}</span>
                      </div>
                      {entry.note && (
                        <p className="text-purple-200/80 text-xs mt-1 italic truncate max-w-md">
                          "{entry.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nút Sửa & Xóa cho từng mục lịch sử */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-xs px-2.5 py-1 rounded-lg glass text-purple-200 hover:text-white hover:bg-purple-600/30 transition-all flex items-center gap-1"
                      title="Chỉnh sửa nhật ký"
                    >
                      <span>✎</span>
                      <span className="hidden sm:inline">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs px-2 py-1 rounded-lg glass text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                      title="Xóa nhật ký"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Trạng thái chưa có nhật ký nào */}
      {!loading && entries.length === 0 && !writing && (
        <div className="glass-card p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl glass flex items-center justify-center text-3xl">
            ✍️
          </div>
          <div>
            <p className="text-white font-bold text-base">Chưa có nhật ký nào</p>
            <p className="text-purple-300 text-xs opacity-70 mt-1 max-w-sm mx-auto">
              Hãy bắt đầu lưu giữ những cảm xúc, mức năng lượng và dấu ấn tinh thần theo hành trình của các vì sao hôm nay!
            </p>
          </div>
          <button
            onClick={() => openCreate()}
            className="btn-cosmic px-6 py-2.5 text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
          >
            + Viết Nhật Ký Đầu Tiên
          </button>
        </div>
      )}
    </div>
  );
}
