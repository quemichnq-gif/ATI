import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store';
import { updateProfile } from '../store/profileSlice';
import { apiUpdateProfile, apiUploadImage } from '../services/api';
import { ZODIAC_EMOJIS, ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';

export default function ProfilePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: profile.name, gender: profile.gender || '', job: profile.job || '', height: profile.height || '', weight: profile.weight || '', relationshipStatus: profile.relationshipStatus || 'Độc thân' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];
  const zodiacEmoji = ZODIAC_EMOJIS[profile.sun || ''] || '✨';

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiUpdateProfile({ uid: profile.uid, fields: formData });
      dispatch(updateProfile(formData as any));
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await apiUploadImage({ uid: profile.uid, imageType: 'avatar', imageBase64: base64 });
        if (res.data?.imageUrl) dispatch(updateProfile({ avatar: res.data.imageUrl }));
      };
      reader.readAsDataURL(file);
    } catch (e) { console.error(e); }
    finally { setUploadingAvatar(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Cover + Avatar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        {/* Cover */}
        <div className="h-40 rounded-2xl overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}44, #1a0030)` }}>
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.3"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
            {zodiacEmoji}
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden cursor-pointer"
              style={{ border: `3px solid ${colors[0]}`, boxShadow: `0 0 20px ${colors[0]}44` }}
              onClick={() => fileInputRef.current?.click()}>
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-4xl"
                    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                    {profile.name?.[0]?.toUpperCase() || '✨'}
                  </div>
              }
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer"
              style={{ background: colors[0] }} onClick={() => fileInputRef.current?.click()}>
              📷
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="pt-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-purple-300 opacity-70">{profile.email}</p>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="btn-cosmic px-5 py-2 text-sm">
            {saving ? '⏳ Đang lưu...' : editing ? '✅ Lưu' : '✏️ Chỉnh sửa'}
          </button>
        </div>

        {/* Zodiac info */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="glass px-3 py-1 rounded-full text-sm text-white">{zodiacEmoji} {profile.sun}</span>
          <span className="glass px-3 py-1 rounded-full text-sm text-white">🌙 {profile.moon}</span>
          <span className="glass px-3 py-1 rounded-full text-sm text-white" style={{ color: colors[0] }}>⬆️ {profile.ascendant}</span>
          <span className="glass px-3 py-1 rounded-full text-sm" style={{ color: colors[0] }}>🌟 {element}</span>
        </div>
      </div>

      {/* Edit form or info cards */}
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
          <h2 className="text-white font-semibold mb-2">✏️ Chỉnh Sửa Thông Tin</h2>
          {[
            { key: 'name', label: 'Họ tên', type: 'text', placeholder: 'Họ và tên' },
            { key: 'job', label: 'Nghề nghiệp', type: 'text', placeholder: 'Công việc của bạn' },
            { key: 'height', label: 'Chiều cao (cm)', type: 'number', placeholder: '170' },
            { key: 'weight', label: 'Cân nặng (kg)', type: 'number', placeholder: '60' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-purple-300 text-sm mb-1">{f.label}</label>
              <input type={f.type} className="cosmic-input" placeholder={f.placeholder}
                value={(formData as any)[f.key] || ''}
                onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-purple-300 text-sm mb-2">Tình trạng</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Độc thân',
                'Đang trong mối quan hệ',
                'Sống chung',
                'Đã đính hôn',
                'Đã kết hôn',
                'Ly thân',
                'Đã ly hôn',
                'Góa',
                'Mối quan hệ phức tạp',
              ].map(s => (
                <button key={s} type="button"
                  onClick={() => setFormData(p => ({ ...p, relationshipStatus: s }))}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all ${
                    formData.relationshipStatus === s ? 'text-white font-medium border border-pink-400' : 'text-purple-300 glass hover:text-white'
                  }`}
                  style={formData.relationshipStatus === s ? { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setEditing(false)} className="text-purple-400 text-sm hover:text-white">
            Huỷ
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '📅 Ngày sinh', value: profile.birthDate },
            { label: '⏰ Giờ sinh', value: profile.birthTime },
            { label: '📍 Nơi sinh', value: profile.birthPlace },
            { label: '🎂 Tuổi', value: profile.age?.toString() },
            { label: '💼 Nghề nghiệp', value: profile.job || '—' },
            { label: '💑 Tình trạng', value: profile.relationshipStatus || '—' },
            { label: '📏 Chiều cao', value: profile.height ? `${profile.height} cm` : '—' },
            { label: '⚖️ Cân nặng', value: profile.weight ? `${profile.weight} kg` : '—' },
          ].map(item => (
            <div key={item.label} className="glass-card p-4">
              <p className="text-purple-300 text-xs mb-1 opacity-70">{item.label}</p>
              <p className="text-white font-semibold text-sm">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Elemental breakdown */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4">🌊 Năng Lượng Nguyên Tố</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '🔥 Hoả', val: profile.fireRatio || 0, color: '#ef4444' },
            { label: '🌍 Thổ', val: profile.earthRatio || 0, color: '#a16207' },
            { label: '💨 Khí', val: profile.airRatio || 0, color: '#06b6d4' },
            { label: '💧 Thuỷ', val: profile.waterRatio || 0, color: '#3b82f6' },
          ].map(e => (
            <div key={e.label} className="glass p-3 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white">{e.label}</span>
                <span className="text-sm font-bold" style={{ color: e.color }}>{e.val}%</span>
              </div>
              <div className="cosmic-progress">
                <motion.div initial={{ width: 0 }} animate={{ width: `${e.val}%` }}
                  transition={{ duration: 1 }}
                  style={{ height: '100%', borderRadius: '3px', background: e.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
