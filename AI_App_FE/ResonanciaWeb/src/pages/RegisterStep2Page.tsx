import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { fetchAstrologyData } from '../services/astrologyService';
import StarField from '../components/StarField';

const steps = [
  { id: 1, label: 'Thông Tin Cá Nhân', icon: '👤' },
  { id: 2, label: 'Tình Trạng Mối Quan Hệ', icon: '💞' },
  { id: 3, label: 'Ngày & Giờ Sinh', icon: '📅' },
  { id: 4, label: 'Nơi Sinh', icon: '📍' },
];

export const RELATIONSHIP_OPTIONS = [
  {
    id: 'Độc thân',
    label: 'Độc thân',
    iconType: 'single',
    desc: 'Đang tìm kiếm một nửa'
  },
  {
    id: 'Đang trong mối quan hệ',
    label: 'Đang trong\nmối quan hệ',
    iconType: 'in_relationship',
    desc: 'Đang hẹn hò, gắn kết'
  },
  {
    id: 'Sống chung',
    label: 'Sống chung',
    iconType: 'cohabiting',
    desc: 'Chung một mái nhà'
  },
  {
    id: 'Đã đính hôn',
    label: 'Đã đính hôn',
    iconType: 'engaged',
    desc: 'Chuẩn bị về một nhà'
  },
  {
    id: 'Đã kết hôn',
    label: 'Đã kết hôn',
    iconType: 'married',
    desc: 'Đã kết duyên trăm năm'
  },
  {
    id: 'Ly thân',
    label: 'Ly thân',
    iconType: 'separated',
    desc: 'Đang tạm thời tách rời'
  },
  {
    id: 'Đã ly hôn',
    label: 'Đã ly hôn',
    iconType: 'divorced',
    desc: 'Mở lòng đón khởi đầu mới'
  },
  {
    id: 'Góa',
    label: 'Góa',
    iconType: 'widowed',
    desc: 'Trân trọng ký ức thiêng liêng'
  },
  {
    id: 'Mối quan hệ phức tạp',
    label: 'Mối quan hệ\nphức tạp',
    iconType: 'complicated',
    desc: 'Cần sự thấu hiểu & duyên số'
  },
];

function RelationshipIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? '#f472b6' : '#a855f7';
  switch (type) {
    case 'single':
      // Trái tim mặt cười
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 39S10 28 10 17a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11-14 22-14 22z" />
          <circle cx="19" cy="18" r="1.5" fill={color} />
          <circle cx="29" cy="18" r="1.5" fill={color} />
          <path d="M20 23c1.5 2 6.5 2 8 0" />
        </svg>
      );
    case 'in_relationship':
      // Hai trái tim lồng nhau
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 37S8 28 8 18a7 7 0 0 1 12-4.5 7 7 0 0 1 12 4.5c0 10-12 19-12 19z" />
          <path d="M31 11a5.5 5.5 0 0 1 9.5 3.5c0 7-9 14-9 14" strokeDasharray="1 1" />
          <circle cx="16" cy="19" r="1.2" fill={color} />
          <circle cx="24" cy="19" r="1.2" fill={color} />
          <path d="M17 23c1 1.5 5 1.5 6 0" />
        </svg>
      );
    case 'cohabiting':
      // Ngôi nhà sống chung
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22l16-13 16 13v17a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V22z" />
          <path d="M20 42V26h8v16" />
        </svg>
      );
    case 'engaged':
      // Nhẫn kim cương lồng nhau
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="27" r="10" />
          <circle cx="30" cy="27" r="10" />
          <path d="M24 13l4-6h-8l4 6z" />
        </svg>
      );
    case 'married':
      // Biểu tượng Nam - Nữ kết hợp
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="19" cy="27" r="8" />
          <path d="M25 21l8-8m0 0h-6m6 0v6" />
          <circle cx="29" cy="23" r="8" />
          <path d="M29 31v8m-4-4h8" />
        </svg>
      );
    case 'separated':
      // Hai mảnh ghép xếp hình rời
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 12h8v5a2 2 0 1 0 4 0v-5h8v8h-5a2 2 0 1 0 0 4h5v8h-8v-5a2 2 0 1 0-4 0v5h-8z" />
          <path d="M29 27l8 8m-4-8h8v8" />
        </svg>
      );
    case 'divorced':
      // Trái tim tan vỡ
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 39S10 28 10 17a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11-14 22-14 22z" />
          <path d="M24 12l-4 8 7 4-5 9 3 6" />
        </svg>
      );
    case 'widowed':
      // Trái tim có vòng thiên thần
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="24" cy="9" rx="12" ry="3.5" />
          <path d="M24 40S10 29 10 18a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11-14 22-14 22z" />
          <circle cx="19" cy="20" r="1.3" fill={color} />
          <circle cx="29" cy="20" r="1.3" fill={color} />
          <path d="M21 25h6" />
        </svg>
      );
    case 'complicated':
      // Trái tim dấu hỏi
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 39S10 28 10 17a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11-14 22-14 22z" />
          <path d="M21 17a3 3 0 0 1 5-1c1.5 1 1 3-1 4v2" />
          <circle cx="25" cy="27" r="1.2" fill={color} />
        </svg>
      );
    default:
      return <div className="text-3xl">❤️</div>;
  }
}

export default function RegisterStep2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uid, email } = (location.state || {}) as { uid: string; email: string };

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('Độc thân');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!fullName || !birthDate || !birthTime || !birthPlace) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) return setError('Ngày sinh: YYYY-MM-DD (VD: 2001-06-27)');
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(birthTime)) return setError('Giờ sinh: HH:MM (VD: 03:20)');

    setLoading(true); setError('');
    try {
      setLoadingMsg('🔮 Đang tính toán biểu đồ chiêm tinh...');
      let astro: Record<string, any> = {};
      try {
        astro = await fetchAstrologyData(birthDate, birthTime, birthPlace);
      } catch {
        const [year] = birthDate.split('-').map(Number);
        astro = { age: new Date().getFullYear() - year };
      }

      setLoadingMsg('💾 Đang lưu thông tin...');
      await setDoc(doc(db, 'users', uid), {
        name: fullName, age: astro.age || 0, gender,
        birthDate, birthTime, birthPlace, email: email || '',
        relationshipStatus: relationshipStatus || 'Độc thân',
        sun: astro.sun || '', moon: astro.moon || '',
        mercury: astro.mercury || '', venus: astro.venus || '', mars: astro.mars || '',
        jupiter: astro.jupiter || '', saturn: astro.saturn || '',
        uranus: astro.uranus || '', neptune: astro.neptune || '', pluto: astro.pluto || '',
        ascendant: astro.ascendant || '', descendant: astro.descendant || '',
        mc: astro.mc || '', ic: astro.ic || '',
        house1: astro.house1 || '', house2: astro.house2 || '', house3: astro.house3 || '',
        house4: astro.house4 || '', house5: astro.house5 || '', house6: astro.house6 || '',
        house7: astro.house7 || '', house8: astro.house8 || '', house9: astro.house9 || '',
        house10: astro.house10 || '', house11: astro.house11 || '', house12: astro.house12 || '',
        conjunctionAspect: astro.conjunctionAspect || '',
        oppositionAspect: astro.oppositionAspect || '',
        trineAspect: astro.trineAspect || '',
        squareAspect: astro.squareAspect || '',
        sextileAspect: astro.sextileAspect || '',
        natalChartImage: astro.natalChartImage || '',
        fireRatio: astro.fireRatio || 0, earthRatio: astro.earthRatio || 0,
        airRatio: astro.airRatio || 0, waterRatio: astro.waterRatio || 0,
        avatar: '', coverImage: '', height: null, weight: null,
        job: '',
        profileComplete: true, updatedAt: serverTimestamp(),
      }, { merge: true });

      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10"
      style={{ background: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0015 70%, #000 100%)' }}>
      <StarField count={180} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xl mx-4"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step >= s.id ? 'text-white' : 'text-purple-400 opacity-50'
              }`} style={step >= s.id ? {
                background: 'linear-gradient(135deg, rgba(157,78,221,0.5), rgba(255,110,180,0.4))',
                border: '1px solid rgba(255,110,180,0.5)',
                boxShadow: '0 0 10px rgba(157,78,221,0.3)'
              } : {}}>
                <span>{s.icon}</span>
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-4 sm:w-6 h-0.5 ${step > s.id ? 'bg-pink-400' : 'bg-purple-900'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8" style={{ border: '1px solid rgba(157,78,221,0.3)', backdropFilter: 'blur(20px)' }}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{steps[step - 1].icon}</div>
            <h2 className="text-xl sm:text-2xl font-bold gradient-text">{steps[step - 1].label}</h2>
            <p className="text-purple-300 text-xs sm:text-sm opacity-70 mt-1">Bước {step} / {steps.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">

              {/* BƯỚC 1: THÔNG TIN CÁ NHÂN */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Họ và tên đầy đủ</label>
                    <input className="cosmic-input" placeholder="Nguyễn Văn A"
                      value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Giới tính</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Nam', 'Nữ', 'Khác'].map(g => (
                        <button key={g} type="button"
                          onClick={() => setGender(g)}
                          className={`py-3 rounded-xl text-sm font-medium transition-all ${
                            gender === g ? 'text-white border-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.4)]' : 'text-purple-300 bg-white/5 border-purple-800/40'
                          }`}
                          style={{
                            borderWidth: 1,
                            background: gender === g ? 'linear-gradient(135deg, rgba(157,78,221,0.6), rgba(255,110,180,0.6))' : 'rgba(255,255,255,0.03)'
                          }}>
                          {g === 'Nam' ? '♂' : g === 'Nữ' ? '♀' : '⚧'} {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* BƯỚC 2: TÌNH TRẠNG MỐI QUAN HỆ (THEO ĐÚNG ẢNH MẪU) */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-5">
                    <h3 className="text-white text-base sm:text-lg font-semibold leading-snug">
                      Từ nào mô tả đúng nhất tình trạng mối quan hệ của bạn?
                    </h3>
                    <p className="text-purple-300 text-xs mt-1 opacity-70">
                      Giúp AI Resonancia định vị năng lượng duyên số chuẩn xác nhất
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {RELATIONSHIP_OPTIONS.map((item) => {
                      const isSelected = relationshipStatus === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setRelationshipStatus(item.id)}
                          className={`cursor-pointer rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all ${
                            isSelected
                              ? 'border-2 border-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.45)]'
                              : 'border border-purple-800/40 hover:border-purple-500/50'
                          }`}
                          style={{
                            minHeight: 115,
                            background: isSelected
                              ? 'linear-gradient(145deg, rgba(88,28,135,0.5), rgba(157,78,221,0.3))'
                              : 'rgba(22, 10, 46, 0.45)',
                          }}
                        >
                          <div className="mb-2">
                            <RelationshipIcon type={item.iconType} active={isSelected} />
                          </div>
                          <span className={`text-xs sm:text-sm font-medium whitespace-pre-line leading-tight ${
                            isSelected ? 'text-white font-bold' : 'text-purple-200 opacity-90'
                          }`}>
                            {item.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BƯỚC 3: NGÀY & GIỜ SINH */}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Ngày sinh (YYYY-MM-DD)</label>
                    <input className="cosmic-input" placeholder="2001-06-27" type="date"
                      value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                    <p className="text-xs text-purple-400 mt-1 opacity-60">VD: 2001-06-27</p>
                  </div>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Giờ sinh (HH:MM)</label>
                    <input className="cosmic-input" placeholder="03:20" type="time"
                      value={birthTime} onChange={e => setBirthTime(e.target.value)} />
                    <p className="text-xs text-purple-400 mt-1 opacity-60">Giờ sinh chính xác để tính Điểm mọc (Ascendant) và 12 cung địa bàn</p>
                  </div>
                </>
              )}

              {/* BƯỚC 4: NƠI SINH & TỔNG KẾT */}
              {step === 4 && (
                <>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Nơi sinh</label>
                    <input className="cosmic-input" placeholder="Hà Nội, Việt Nam"
                      value={birthPlace} onChange={e => setBirthPlace(e.target.value)} />
                    <p className="text-xs text-purple-400 mt-1 opacity-60">Tên thành phố hoặc địa chỉ đầy đủ</p>
                  </div>

                  {/* Summary card */}
                  {fullName && (
                    <div className="glass p-4 rounded-xl mt-4 space-y-1.5" style={{ border: '1px solid rgba(157,78,221,0.3)', background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-purple-300 text-xs mb-2 font-semibold">✦ Tóm tắt hồ sơ của bạn</p>
                      <p className="text-white text-sm"><span className="text-purple-300">Họ tên:</span> {fullName}</p>
                      <p className="text-white text-sm"><span className="text-purple-300">Tình trạng:</span> <span className="text-pink-300 font-semibold">{relationshipStatus}</span></p>
                      {birthDate && <p className="text-white text-sm"><span className="text-purple-300">Ngày sinh:</span> {birthDate} {birthTime ? `(${birthTime})` : ''}</p>}
                      {gender && <p className="text-white text-sm"><span className="text-purple-300">Giới tính:</span> {gender}</p>}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {loadingMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 mt-4 p-3 rounded-xl"
              style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
              <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin flex-shrink-0" />
              <p className="text-pink-200 text-sm font-medium">{loadingMsg}</p>
            </motion.div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2 mt-4 border border-red-500/20">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && !loading && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-purple-300 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ← Quay lại
              </button>
            )}
            <button
              onClick={() => {
                setError('');
                if (step === 1 && !fullName) return setError('Vui lòng nhập họ tên');
                if (step === 2 && !relationshipStatus) return setError('Vui lòng chọn tình trạng mối quan hệ');
                if (step === 3 && (!birthDate || !birthTime)) return setError('Vui lòng nhập ngày và giờ sinh');
                if (step < 4) {
                  setStep(s => s + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={loading}
              className="flex-1 btn-cosmic py-3 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : step < 4 ? 'Tiếp Theo →' : '🚀 Hoàn Tất & Khám Phá'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
