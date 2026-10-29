import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { fetchAstrologyData } from '../services/astrologyService';
import StarField from '../components/StarField';

const steps = [
  { id: 1, label: 'Thông Tin Cá Nhân', icon: '👤' },
  { id: 2, label: 'Ngày & Giờ Sinh', icon: '📅' },
  { id: 3, label: 'Nơi Sinh', icon: '📍' },
];

export default function RegisterStep2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uid, email } = (location.state || {}) as { uid: string; email: string };

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
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
        job: '', relationshipStatus: 'Độc thân',
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0015 70%, #000 100%)' }}>
      <StarField count={180} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step >= s.id ? 'text-white' : 'text-purple-400 opacity-50'
              }`} style={step >= s.id ? {
                background: 'linear-gradient(135deg, rgba(157,78,221,0.4), rgba(255,110,180,0.3))',
                border: '1px solid rgba(157,78,221,0.4)',
              } : {}}>
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${step > s.id ? 'bg-purple-400' : 'bg-purple-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-8" style={{ border: '1px solid rgba(157,78,221,0.3)' }}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{steps[step - 1].icon}</div>
            <h2 className="text-2xl font-bold gradient-text">{steps[step - 1].label}</h2>
            <p className="text-purple-300 text-sm opacity-70 mt-1">Bước {step} / {steps.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">

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
                          className={`py-2 rounded-xl text-sm font-medium transition-all ${
                            gender === g ? 'text-white' : 'text-purple-300 bg-white/5'
                          }`}
                          style={gender === g ? { background: 'linear-gradient(135deg, #9d4edd, #ff6eb4)' } : {}}>
                          {g === 'Nam' ? '♂' : g === 'Nữ' ? '♀' : '⚧'} {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
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
                    <p className="text-xs text-purple-400 mt-1 opacity-60">Giờ sinh chính xác để tính ascendant</p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">Nơi sinh</label>
                    <input className="cosmic-input" placeholder="Hà Nội, Việt Nam"
                      value={birthPlace} onChange={e => setBirthPlace(e.target.value)} />
                    <p className="text-xs text-purple-400 mt-1 opacity-60">Tên thành phố hoặc địa chỉ đầy đủ</p>
                  </div>

                  {/* Summary card */}
                  {fullName && birthDate && (
                    <div className="glass p-4 rounded-xl mt-4" style={{ border: '1px solid rgba(157,78,221,0.2)' }}>
                      <p className="text-purple-300 text-xs mb-2 font-medium">✦ Tóm tắt thông tin</p>
                      <p className="text-white text-sm"><span className="text-purple-300">Tên:</span> {fullName}</p>
                      <p className="text-white text-sm"><span className="text-purple-300">Ngày sinh:</span> {birthDate} {birthTime}</p>
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
              style={{ background: 'rgba(157,78,221,0.1)' }}>
              <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin flex-shrink-0" />
              <p className="text-purple-300 text-sm">{loadingMsg}</p>
            </motion.div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2 mt-4">{error}</p>
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
                if (step < 3) {
                  if (step === 1 && !fullName) return setError('Nhập họ tên');
                  if (step === 2 && (!birthDate || !birthTime)) return setError('Nhập ngày và giờ sinh');
                  setStep(s => s + 1);
                } else handleSubmit();
              }}
              disabled={loading}
              className="flex-1 btn-cosmic py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : step < 3 ? 'Tiếp Theo →' : '🚀 Hoàn Tất'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
