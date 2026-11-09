import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../services/firebase';
import { setAuth, clearAuth } from '../store/authSlice';
import { setProfile, clearProfile } from '../store/profileSlice';
import { calculateAstrologyFallback } from '../services/astrologyService';
import { RootState } from '../store';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';

export function useAuth() {
  const dispatch = useDispatch();
  const authState = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = user.email || '';
        dispatch(setAuth({ uid: user.uid, email: userEmail }));

        // 1. Kiểm tra nếu là Test Account mẫu (Hà My, Tuấn, Trần Đại Nghĩa)
        const testAccount = getTestProfileByEmailOrUid(userEmail) || getTestProfileByEmailOrUid(user.uid);

        // 2. Phục hồi ngay lập tức từ Persistent LocalStorage cache
        let cachedData: any = null;
        try {
          const raw = localStorage.getItem(`resonancia_profile_${user.uid}`);
          if (raw) cachedData = JSON.parse(raw);
        } catch (e) {
          console.warn('Lỗi đọc cache profile:', e);
        }

        if (!cachedData) {
          try {
            const rawLast = localStorage.getItem('resonancia_last_profile');
            if (rawLast) {
              const last = JSON.parse(rawLast);
              if (last && (last.uid === user.uid || (last.email && last.email === userEmail))) {
                cachedData = last;
              }
            }
          } catch {}
        }

        const effectiveName =
          cachedData?.name?.trim() ||
          testAccount?.name ||
          user.displayName?.trim() ||
          (userEmail ? userEmail.split('@')[0] : 'Người dùng');

        const initialProfile = {
          uid: user.uid,
          email: userEmail,
          name: effectiveName,
          ...(testAccount || {}),
          ...(cachedData || {}),
        };
        dispatch(setProfile(initialProfile as any));

        // Lưu cache để không bị mất khi reload
        try {
          localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(initialProfile));
          localStorage.setItem('resonancia_last_profile', JSON.stringify(initialProfile));
        } catch {}

        // 3. Thử đồng bộ dữ liệu mới nhất từ Firestore
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            let fullData: any = null;
            if (data.birthDate && (!data.sun || !data.ascendant)) {
              const astro = calculateAstrologyFallback(data.birthDate, data.birthTime || '06:00');
              fullData = { ...(testAccount || {}), ...astro, ...data, uid: user.uid, email: userEmail };
              setDoc(doc(db, 'users', user.uid), astro, { merge: true }).catch(() => {});
            } else {
              fullData = { ...(testAccount || {}), uid: user.uid, email: userEmail, ...data };
            }

            dispatch(setProfile(fullData as any));
            try {
              localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(fullData));
              localStorage.setItem('resonancia_last_profile', JSON.stringify(fullData));
            } catch {}
          }
        } catch (e) {
          // Firestore fallback đã có initialProfile an toàn
        }
      } else {
        dispatch(clearAuth());
        dispatch(clearProfile());
      }
    });
    return unsub;
  }, [dispatch]);

  return authState;
}
