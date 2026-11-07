import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { RootState } from '../store';
import { updateProfile } from '../store/profileSlice';
import { apiUpdateProfile, apiUploadImage } from '../services/api';
import { auth, db } from '../services/firebase';
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';
import type { IconName } from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';
import { RELATIONSHIP_OPTIONS } from '../constants/relationshipOptions';
import CosmicTimePicker from '../components/CosmicTimePicker';

function parseBirthDate(dateStr?: string) {
  if (!dateStr) return { day: '', month: '', year: '' };
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      return {
        day: parts[0].padStart(2, '0'),
        month: parts[1].padStart(2, '0'),
        year: parts[2],
      };
    }
  }
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      return {
        day: parts[2].padStart(2, '0'),
        month: parts[1].padStart(2, '0'),
        year: parts[0],
      };
    }
  }
  return { day: '', month: '', year: '' };
}

function normalizeDate(d?: string) {
  if (!d) return '';
  const parsed = parseBirthDate(d);
  if (parsed.day && parsed.month && parsed.year) {
    return `${parsed.day}/${parsed.month}/${parsed.year}`;
  }
  return d.trim();
}

function validateDateOfBirth(d: string, m: string, y: string): { valid: boolean; error?: string } {
  if (!d || !m || !y) {
    return { valid: false, error: 'Vui lòng nhập đầy đủ ngày, tháng và năm sinh.' };
  }
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);

  if (isNaN(day) || day < 1 || day > 31) {
    return { valid: false, error: 'Ngày sinh không hợp lệ (1-31).' };
  }
  if (isNaN(month) || month < 1 || month > 12) {
    return { valid: false, error: 'Tháng sinh không hợp lệ (1-12).' };
  }
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < 1900 || year > currentYear) {
    return { valid: false, error: `Năm sinh không hợp lệ (1900 - ${currentYear}).` };
  }

  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    return { valid: false, error: 'Ngày tháng không tồn tại trong lịch (ví dụ tháng 2 năm nhuận).' };
  }

  const now = new Date();
  if (dateObj > now) {
    return { valid: false, error: 'Ngày sinh không được vượt quá ngày hiện tại.' };
  }

  return { valid: true };
}

function validateBirthTime(timeStr?: string): boolean {
  if (!timeStr) return false;
  const regex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  return regex.test(timeStr.trim());
}

export default function ProfilePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);

  // Form states
  const initialBirth = parseBirthDate(profile.birthDate);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    gender: profile.gender || '',
    job: profile.job || '',
    height: profile.height ? String(profile.height) : '',
    weight: profile.weight ? String(profile.weight) : '',
    relationshipStatus: profile.relationshipStatus || 'Độc thân',
    birthDay: initialBirth.day,
    birthMonth: initialBirth.month,
    birthYear: initialBirth.year,
    birthTime: profile.birthTime || '06:00',
    birthPlace: profile.birthPlace || '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showStaleModal, setShowStaleModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  useEffect(() => {
    if (!editing) {
      const b = parseBirthDate(profile.birthDate);
      setFormData({
        name: profile.name || '',
        gender: profile.gender || '',
        job: profile.job || '',
        height: profile.height ? String(profile.height) : '',
        weight: profile.weight ? String(profile.weight) : '',
        relationshipStatus: profile.relationshipStatus || 'Độc thân',
        birthDay: b.day,
        birthMonth: b.month,
        birthYear: b.year,
        birthTime: profile.birthTime || '06:00',
        birthPlace: profile.birthPlace || '',
      });
      setErrorMsg('');
    }
  }, [
    profile.name,
    profile.gender,
    profile.job,
    profile.height,
    profile.weight,
    profile.relationshipStatus,
    profile.birthDate,
    profile.birthTime,
    profile.birthPlace,
    editing,
  ]);

  // Dirty check & save initiator
  const handlePreSave = () => {
    setErrorMsg('');

    // 1. Validation ngày sinh
    const dateVal = validateDateOfBirth(formData.birthDay, formData.birthMonth, formData.birthYear);
    if (!dateVal.valid) {
      setErrorMsg(dateVal.error || 'Ngày sinh không hợp lệ');
      return;
    }

    // 2. Validation giờ sinh
    if (!validateBirthTime(formData.birthTime)) {
      setErrorMsg('Giờ sinh không hợp lệ: HH:mm (VD: 06:00)');
      return;
    }

    // 3. Validation nơi sinh
    if (!formData.birthPlace.trim()) {
      setErrorMsg('Vui lòng nhập nơi sinh (Tỉnh / Thành phố).');
      return;
    }

    // 4. Dirty checking: So sánh với dữ liệu ban đầu
    const newBirthDate = `${formData.birthDay.padStart(2, '0')}/${formData.birthMonth.padStart(2, '0')}/${formData.birthYear}`;
    const oldBirthDate = normalizeDate(profile.birthDate);
    const oldBirthTime = (profile.birthTime || '').trim();
    const oldBirthPlace = (profile.birthPlace || '').trim().toLowerCase();

    const hasBirthInfoChanged =
      newBirthDate !== oldBirthDate ||
      formData.birthTime.trim() !== oldBirthTime ||
      formData.birthPlace.trim().toLowerCase() !== oldBirthPlace;

    if (hasBirthInfoChanged) {
      // Bật modal xác nhận thay đổi dữ liệu sinh
      setShowStaleModal(true);
    } else {
      // Không đổi dữ liệu sinh -> lưu thông thường
      executeSave(false);
    }
  };

  const executeSave = async (markStale: boolean) => {
    const uid = profile.uid || auth.currentUser?.uid;
    if (!uid) {
      alert('Không tìm thấy thông tin đăng nhập, vui lòng đăng nhập lại.');
      return;
    }

    setSaving(true);
    try {
      const newBirthDate = `${formData.birthDay.padStart(2, '0')}/${formData.birthMonth.padStart(2, '0')}/${formData.birthYear}`;
      const saveFields: any = {
        name: formData.name.trim(),
        gender: formData.gender,
        job: formData.job.trim(),
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        relationshipStatus: formData.relationshipStatus,
        birthDate: newBirthDate,
        birthTime: formData.birthTime.trim(),
        birthPlace: formData.birthPlace.trim(),
      };

      if (markStale) {
        saveFields.is_stale = true;
        saveFields.needs_recalculation = true;
      }

      // 1. Cập nhật Redux store ngay lập tức để UI phản hồi mượt mà
      dispatch(updateProfile(saveFields));

      // Lưu vào Persistent LocalStorage
      try {
        const mergedData = { ...profile, ...saveFields };
        localStorage.setItem(`resonancia_profile_${uid}`, JSON.stringify(mergedData));
        localStorage.setItem('resonancia_last_profile', JSON.stringify(mergedData));
      } catch (errLocal) {
        console.warn('Lỗi lưu profile vào LocalStorage:', errLocal);
      }

      // Cập nhật Firebase Auth displayName
      if (auth.currentUser && saveFields.name?.trim()) {
        try {
          await fbUpdateProfile(auth.currentUser, { displayName: saveFields.name.trim() });
        } catch {}
      }

      // 2. Lưu trực tiếp vào Firestore từ client
      try {
        await setDoc(doc(db, 'users', uid), {
          ...saveFields,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (errFirestore) {
        console.warn('Lưu Firestore trực tiếp từ client:', errFirestore);
      }

      // 3. Đồng bộ với Backend API
      try {
        await apiUpdateProfile({ uid, fields: saveFields });
      } catch (errApi) {
        console.warn('Đồng bộ profile với backend API:', errApi);
      }

      setEditing(false);
      setShowStaleModal(false);
      setErrorMsg('');

      if (markStale) {
        setToastMessage('Đã lưu thông tin mới. Bản đồ sao gốc cần được tạo lại tại Trang Chủ.');
        setTimeout(() => setToastMessage(''), 7000);
      }
    } catch (e: any) {
      console.error('Lỗi khi lưu hồ sơ:', e);
      setErrorMsg('Có lỗi xảy ra khi lưu: ' + (e.message || 'Vui lòng thử lại'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uid = profile.uid || auth.currentUser?.uid;
    if (!uid) {
      alert('Chưa xác thực được người dùng, vui lòng đăng nhập lại.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Không thể đọc ảnh'));
        reader.onerror = () => reject(reader.error || new Error('Không thể đọc ảnh'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1];
      const res = await apiUploadImage({
        uid,
        imageType: 'avatar',
        imageData: base64,
        imageBase64: base64,
      });
      if (res.data?.imageUrl) {
        const imageUrl = res.data.imageUrl;
        dispatch(updateProfile({ avatar: imageUrl }));
        try {
          await setDoc(doc(db, 'users', uid), { avatar: imageUrl }, { merge: true });
        } catch (fe) {
          console.warn('Lưu avatar vào Firestore trực tiếp:', fe);
        }
      }
    } catch (e: any) {
      console.error('Lỗi tải ảnh đại diện:', e);
      alert('Không thể tải ảnh đại diện lên: ' + (e.response?.data?.error || e.message || 'Lỗi mạng'));
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uid = profile.uid || auth.currentUser?.uid;
    if (!uid) return;

    setUploadingCover(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Không thể đọc ảnh'));
        reader.onerror = () => reject(reader.error || new Error('Không thể đọc ảnh'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1];
      const res = await apiUploadImage({
        uid,
        imageType: 'coverImage',
        imageData: base64,
        imageBase64: base64,
      });
      if (res.data?.imageUrl) {
        const imageUrl = res.data.imageUrl;
        dispatch(updateProfile({ coverImage: imageUrl }));
        try {
          await setDoc(doc(db, 'users', uid), { coverImage: imageUrl }, { merge: true });
        } catch (fe) {
          console.warn('Lưu cover vào Firestore trực tiếp:', fe);
        }
      }
    } catch (e: any) {
      console.error('Lỗi tải ảnh bìa:', e);
      alert('Không thể tải ảnh bìa lên: ' + (e.response?.data?.error || e.message || 'Lỗi mạng'));
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <UiIcon name="sparkles" label="Thông báo" className="text-amber-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="text-white bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
            >
              Về Trang Chủ →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover + Avatar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        {/* Cover */}
        <div
          className="h-44 rounded-2xl overflow-hidden relative group"
          style={{
            background: profile.coverImage
              ? `url(${profile.coverImage}) center/cover no-repeat`
              : `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}44, #1a0030)`,
          }}
        >
          {!profile.coverImage && (
            <>
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.3"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
                <ZodiacIcon sign={profile.sun} label={profile.sun ? `Cung ${profile.sun}` : 'Cung Mặt Trời'} />
              </div>
            </>
          )}

          {/* Change cover button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs font-medium text-white glass hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer border-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <UiIcon name="camera" label="Đổi ảnh bìa" />
            <span>{uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}</span>
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            <button
              type="button"
              aria-label="Thay ảnh đại diện"
              aria-busy={uploadingAvatar}
              className="w-24 h-24 rounded-2xl overflow-hidden cursor-pointer p-0 border-0 bg-transparent block"
              style={{ border: `3px solid ${colors[0]}`, boxShadow: `0 0 20px ${colors[0]}44` }}
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-4xl"
                  style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                >
                  {profile.name?.[0]?.toUpperCase() || <UiIcon name="user" label="Ảnh đại diện mặc định" />}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" aria-label="Chọn ảnh đại diện" onChange={handleAvatarChange} />
            <button
              type="button"
              aria-label="Chọn ảnh đại diện"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer border-2 border-[#090714] p-0 text-white shadow-md transition-transform hover:scale-110"
              style={{ background: colors[0] }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UiIcon name="camera" label="Chọn ảnh đại diện" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info Header */}
      <div className="pt-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-purple-300 opacity-70">{profile.email}</p>
          </div>
          <button
            onClick={() => (editing ? handlePreSave() : setEditing(true))}
            disabled={saving}
            className="btn-cosmic px-5 py-2 text-sm cursor-pointer"
          >
            {saving ? (
              <>
                <UiIcon name="hourglass" label="Đang lưu" className="mr-1 inline" />
                Đang lưu...
              </>
            ) : editing ? (
              <>
                <UiIcon name="check" label="Lưu" className="mr-1 inline" />
                Lưu
              </>
            ) : (
              <>
                <UiIcon name="edit" label="Chỉnh sửa" className="mr-1 inline" />
                Chỉnh sửa
              </>
            )}
          </button>
        </div>

        {/* Zodiac badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="glass px-3 py-1 rounded-full text-sm text-white">
            <ZodiacIcon sign={profile.sun} label={profile.sun ? `Cung ${profile.sun}` : 'Cung Mặt Trời'} className="mr-1 inline" />
            {profile.sun || 'Chưa định hình'}
          </span>
          <span className="glass px-3 py-1 rounded-full text-sm text-white">
            <UiIcon name="moon" label="Mặt Trăng" className="mr-1 inline" />
            {profile.moon || 'Chưa định hình'}
          </span>
          <span className="glass px-3 py-1 rounded-full text-sm text-white" style={{ color: colors[0] }}>
            <UiIcon name="arrow-up" label="Cung Mọc" className="mr-1 inline" />
            {profile.ascendant || 'Chưa định hình'}
          </span>
          <span className="glass px-3 py-1 rounded-full text-sm" style={{ color: colors[0] }}>
            <UiIcon name="sparkles" label="Nguyên tố" className="mr-1 inline" />
            {element}
          </span>
        </div>

        {/* Stale Warning in View Mode */}
        {!editing && (profile.is_stale || profile.needs_recalculation) && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <UiIcon name="sparkles" label="Cần tạo lại bản đồ sao" className="text-amber-400 shrink-0 animate-pulse" />
              <span>Dữ liệu ngày/giờ/nơi sinh đã thay đổi. Bản đồ sao gốc đang chờ được tạo lại.</span>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="btn-cosmic px-3 py-1 text-xs shrink-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)' }}
            >
              Về Trang Chủ Tạo Lại
            </button>
          </div>
        )}
      </div>

      {/* Edit Form or Info Cards */}
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <UiIcon name="edit" label="Chỉnh sửa thông tin" className="text-purple-400" />
            Chỉnh Sửa Thông Tin
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <UiIcon name="hourglass" label="Lỗi" className="text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Họ tên */}
          <div>
            <label htmlFor="profile-name" className="block text-purple-300 text-sm mb-1">
              Họ tên
            </label>
            <input
              id="profile-name"
              type="text"
              className="cosmic-input"
              placeholder="Họ và tên"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Ngày sinh (DD/MM/YYYY) */}
          <div>
            <label className="block text-purple-300 text-sm mb-1.5 flex items-center justify-between">
              <span>Ngày sinh (DD/MM/YYYY)</span>
              <span className="text-xs text-amber-300/80 font-normal">✦ Dữ liệu tính Bản đồ sao</span>
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Ô Ngày */}
              <div className="flex-1">
                <input
                  ref={dayInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Ngày"
                  maxLength={2}
                  className="cosmic-input text-center text-sm font-medium tracking-wide px-1"
                  value={formData.birthDay}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setFormData(p => ({ ...p, birthDay: val }));
                    if (val.length === 2) {
                      monthInputRef.current?.focus();
                      monthInputRef.current?.select();
                    }
                  }}
                  onKeyDown={e => {
                    if (
                      e.key === 'ArrowRight' &&
                      (e.currentTarget.selectionStart === e.currentTarget.value.length || formData.birthDay.length === 2)
                    ) {
                      monthInputRef.current?.focus();
                    }
                  }}
                  onPaste={e => {
                    e.preventDefault();
                    const pasteText = e.clipboardData.getData('text');
                    const digits = pasteText.replace(/\D/g, '');
                    if (digits.length >= 8) {
                      setFormData(p => ({
                        ...p,
                        birthDay: digits.slice(0, 2),
                        birthMonth: digits.slice(2, 4),
                        birthYear: digits.slice(4, 8),
                      }));
                      yearInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              <span className="text-purple-400/60 font-semibold text-lg select-none">/</span>

              {/* Ô Tháng */}
              <div className="flex-1">
                <input
                  ref={monthInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Tháng"
                  maxLength={2}
                  className="cosmic-input text-center text-sm font-medium tracking-wide px-1"
                  value={formData.birthMonth}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setFormData(p => ({ ...p, birthMonth: val }));
                    if (val.length === 2) {
                      yearInputRef.current?.focus();
                      yearInputRef.current?.select();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !formData.birthMonth) {
                      dayInputRef.current?.focus();
                    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
                      dayInputRef.current?.focus();
                    } else if (
                      e.key === 'ArrowRight' &&
                      (e.currentTarget.selectionStart === e.currentTarget.value.length || formData.birthMonth.length === 2)
                    ) {
                      yearInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              <span className="text-purple-400/60 font-semibold text-lg select-none">/</span>

              {/* Ô Năm */}
              <div className="flex-[1.4]">
                <input
                  ref={yearInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Năm"
                  maxLength={4}
                  className="cosmic-input text-center text-sm font-medium tracking-wide px-1"
                  value={formData.birthYear}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData(p => ({ ...p, birthYear: val }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !formData.birthYear) {
                      monthInputRef.current?.focus();
                    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
                      monthInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              {/* Nút chọn lịch native */}
              <button
                type="button"
                onClick={() => {
                  try {
                    (datePickerRef.current as any)?.showPicker?.() || datePickerRef.current?.click();
                  } catch {
                    datePickerRef.current?.click();
                  }
                }}
                className="h-11 px-3 rounded-xl glass hover:bg-white/10 text-purple-300 hover:text-white flex items-center justify-center cursor-pointer transition-all border-0 shrink-0"
                title="Chọn từ lịch"
                aria-label="Chọn ngày từ lịch"
              >
                <UiIcon name="calendar" label="Chọn ngày" className="w-5 h-5 opacity-75 hover:opacity-100" />
              </button>
              <input
                ref={datePickerRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only absolute"
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    setFormData(p => ({
                      ...p,
                      birthDay: d,
                      birthMonth: m,
                      birthYear: y,
                    }));
                  }
                }}
              />
            </div>
            <p className="text-xs text-purple-400 mt-1 opacity-60">VD: 10 / 01 / 2005</p>
          </div>

          {/* Giờ sinh */}
          <div>
            <label htmlFor="profile-birth-time" className="block text-purple-300 text-sm mb-1.5 flex items-center justify-between">
              <span>Giờ sinh</span>
              <span className="text-xs text-purple-400/80 font-normal">Chính xác để tính Cung Mọc & 12 Nhà</span>
            </label>
            <CosmicTimePicker
              id="profile-birth-time"
              value={formData.birthTime}
              onChange={val => setFormData(p => ({ ...p, birthTime: val }))}
            />
          </div>

          {/* Nơi sinh */}
          <div>
            <label htmlFor="profile-birth-place" className="block text-purple-300 text-sm mb-1">
              Nơi sinh (Tỉnh / Thành phố)
            </label>
            <input
              id="profile-birth-place"
              type="text"
              className="cosmic-input"
              placeholder="VD: Thanh Hóa, Việt Nam hoặc Hà Nội"
              value={formData.birthPlace}
              onChange={e => setFormData(p => ({ ...p, birthPlace: e.target.value }))}
            />
          </div>

          {/* Nghề nghiệp, Chiều cao, Cân nặng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="profile-job" className="block text-purple-300 text-sm mb-1">
                Nghề nghiệp
              </label>
              <input
                id="profile-job"
                type="text"
                className="cosmic-input"
                placeholder="Công việc của bạn"
                value={formData.job}
                onChange={e => setFormData(p => ({ ...p, job: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="profile-height" className="block text-purple-300 text-sm mb-1">
                Chiều cao (cm)
              </label>
              <input
                id="profile-height"
                type="number"
                className="cosmic-input"
                placeholder="170"
                value={formData.height}
                onChange={e => setFormData(p => ({ ...p, height: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="profile-weight" className="block text-purple-300 text-sm mb-1">
                Cân nặng (kg)
              </label>
              <input
                id="profile-weight"
                type="number"
                className="cosmic-input"
                placeholder="60"
                value={formData.weight}
                onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))}
              />
            </div>
          </div>

          {/* Tình trạng mối quan hệ */}
          <div>
            <p className="block text-purple-300 text-sm mb-2">Tình trạng</p>
            <div role="group" aria-label="Tình trạng mối quan hệ" className="flex flex-wrap gap-2">
              {[...new Set([...RELATIONSHIP_OPTIONS.map(option => option.id), formData.relationshipStatus])].map(s => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={formData.relationshipStatus === s}
                  onClick={() => setFormData(p => ({ ...p, relationshipStatus: s }))}
                  className={`px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    formData.relationshipStatus === s ? 'text-white font-medium shadow-md' : 'text-purple-300 glass hover:text-white'
                  }`}
                  style={
                    formData.relationshipStatus === s
                      ? { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }
                      : {}
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-purple-500/20">
            <button
              type="button"
              onClick={handlePreSave}
              disabled={saving}
              className="btn-cosmic px-5 py-2 text-sm flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <UiIcon name="hourglass" label="Đang lưu" className="mr-1 inline" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <UiIcon name="check" label="Lưu thay đổi" className="mr-1 inline" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const b = parseBirthDate(profile.birthDate);
                setFormData({
                  name: profile.name || '',
                  gender: profile.gender || '',
                  job: profile.job || '',
                  height: profile.height ? String(profile.height) : '',
                  weight: profile.weight ? String(profile.weight) : '',
                  relationshipStatus: profile.relationshipStatus || 'Độc thân',
                  birthDay: b.day,
                  birthMonth: b.month,
                  birthYear: b.year,
                  birthTime: profile.birthTime || '06:00',
                  birthPlace: profile.birthPlace || '',
                });
                setEditing(false);
                setErrorMsg('');
              }}
              disabled={saving}
              className="px-4 py-2 text-sm text-purple-300 hover:text-white glass rounded-xl transition-all cursor-pointer border-0"
            >
              Huỷ
            </button>
          </div>
        </motion.div>
      ) : (
        /* Info Cards View */
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: 'calendar', label: 'Ngày sinh', value: profile.birthDate },
            { icon: 'clock', label: 'Giờ sinh', value: profile.birthTime },
            { icon: 'pin', label: 'Nơi sinh', value: profile.birthPlace },
            { icon: 'star', label: 'Tuổi', value: profile.age?.toString() },
            { icon: 'briefcase', label: 'Nghề nghiệp', value: profile.job || '—' },
            { icon: 'heart', label: 'Tình trạng', value: profile.relationshipStatus || '—' },
            { icon: 'ruler', label: 'Chiều cao', value: profile.height ? `${profile.height} cm` : '—' },
            { icon: 'scale', label: 'Cân nặng', value: profile.weight ? `${profile.weight} kg` : '—' },
          ].map(item => (
            <div key={item.label} className="glass-card p-4">
              <p className="text-purple-300 text-xs mb-1 opacity-70">
                <UiIcon name={item.icon as IconName} label={item.label} className="mr-1 inline" />
                {item.label}
              </p>
              <p className="text-white font-semibold text-sm">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Elemental Breakdown */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <UiIcon name="water" label="Năng lượng nguyên tố" className="text-purple-400" />
          Năng Lượng Nguyên Tố
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Hoả', icon: 'flame', val: profile.fireRatio || 0, color: '#ef4444' },
            { label: 'Thổ', icon: 'earth', val: profile.earthRatio || 0, color: '#a16207' },
            { label: 'Khí', icon: 'wind', val: profile.airRatio || 0, color: '#06b6d4' },
            { label: 'Thuỷ', icon: 'water', val: profile.waterRatio || 0, color: '#3b82f6' },
          ].map(e => (
            <div key={e.label} className="glass p-3 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white">
                  <UiIcon name={e.icon as IconName} label={e.label} className="mr-1 inline" />
                  {e.label}
                </span>
                <span className="text-sm font-bold" style={{ color: e.color }}>
                  {e.val}%
                </span>
              </div>
              <div className="cosmic-progress">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${e.val}%` }}
                  transition={{ duration: 1 }}
                  style={{ height: '100%', borderRadius: '3px', background: e.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal xác nhận Dirty Checking thay đổi dữ liệu sinh */}
      {showStaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-6 space-y-4 border border-amber-500/40 relative shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(28, 17, 45, 0.95) 0%, rgba(18, 9, 32, 0.98) 100%)',
            }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-amber-500/40 bg-amber-500/20 text-amber-300 shrink-0">
                <UiIcon name="sparkles" label="Cảnh báo thay đổi" className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Xác nhận thay đổi dữ liệu sinh</h3>
                <p className="text-amber-200/90 text-xs font-medium mt-0.5">Ảnh hưởng trực tiếp đến Bản đồ sao gốc</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-100 leading-relaxed">
              Việc thay đổi ngày/giờ/nơi sinh sẽ làm thay đổi Bản đồ sao gốc. Bạn cần tạo lại Bản đồ sao để cập nhật toàn bộ luận giải và vận hạn liên quan.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStaleModal(false)}
                className="px-4 py-2 text-xs sm:text-sm text-purple-300 hover:text-white glass rounded-xl transition-all border-0 cursor-pointer"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => executeSave(true)}
                disabled={saving}
                className="btn-cosmic px-5 py-2 text-xs sm:text-sm font-semibold cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)' }}
              >
                {saving ? 'Đang lưu...' : 'Tiếp tục & Lưu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
