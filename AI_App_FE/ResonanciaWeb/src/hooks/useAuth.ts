import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../services/firebase';
import { setAuth, clearAuth } from '../store/authSlice';
import { setProfile, clearProfile } from '../store/profileSlice';
import { calculateAstrologyFallback } from '../services/astrologyService';
import { RootState } from '../store';

export function useAuth() {
  const dispatch = useDispatch();
  const authState = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(setAuth({ uid: user.uid, email: user.email || '' }));
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            // Tự động đồng bộ và tính toán lá số nếu tài khoản có ngày sinh mà chưa đủ dữ liệu chiêm tinh
            if (data.birthDate && (!data.sun || !data.ascendant)) {
              const astro = calculateAstrologyFallback(data.birthDate, data.birthTime || '06:00');
              const fullData = { ...astro, ...data, uid: user.uid, email: user.email || '' };
              dispatch(setProfile(fullData as any));
              setDoc(doc(db, 'users', user.uid), astro, { merge: true }).catch(() => {});
            } else {
              dispatch(setProfile({ uid: user.uid, email: user.email || '', ...data } as any));
            }
          }
        } catch (e) { console.error('Profile load error:', e); }
      } else {
        dispatch(clearAuth());
        dispatch(clearProfile());
      }
    });
    return unsub;
  }, [dispatch]);

  return authState;
}
