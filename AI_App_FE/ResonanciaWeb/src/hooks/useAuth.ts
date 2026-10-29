import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../services/firebase';
import { setAuth, clearAuth } from '../store/authSlice';
import { setProfile, clearProfile } from '../store/profileSlice';
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
            dispatch(setProfile({ uid: user.uid, email: user.email || '', ...snap.data() } as any));
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
