import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { RootState } from '../store';
import { auth, db } from '../services/firebase';
import { apiMarkNotificationRead } from '../services/api';
import {
  emitUnreadCount,
  getStoredUnreadCount,
  subscribeNewNotification
} from '../services/notificationSync';

interface ActiveNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  body?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  requestId?: string;
  chatId?: string;
  read?: boolean;
  createdAt?: string | number;
}

export default function NotificationBanner({ menuOpen = false }: { menuOpen?: boolean }) {
  const navigate = useNavigate();
  const profile = useSelector((state: RootState) => state.profile);
  const authUser = useSelector((state: RootState) => state.auth);
  const currentUid = profile.uid || authUser.uid || auth.currentUser?.uid || '';

  const [activeNotif, setActiveNotif] = useState<ActiveNotification | null>(null);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION_MS = 8000;

  const triggerBanner = (notif: ActiveNotification) => {
    if (!notif?.id) return;
    setActiveNotif(notif);
    setProgress(100);
    setIsPaused(false);
  };

  const closeBanner = () => {
    setActiveNotif(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  // 1. Lắng nghe thông báo mới từ Firestore theo thời gian thực (0ms)
  useEffect(() => {
    if (!currentUid) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (initialLoadRef.current) {
          // Ghi nhận toàn bộ ID có sẵn ở lần nạp đầu tiên để không bật banner với thông báo cũ
          snapshot.forEach((docSnap) => {
            seenIdsRef.current.add(docSnap.id);
          });
          initialLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as ActiveNotification;
            const notifId = change.doc.id;
            if (!seenIdsRef.current.has(notifId)) {
              seenIdsRef.current.add(notifId);
              if (!data.read) {
                const notifWithId = { ...data, id: notifId };
                triggerBanner(notifWithId);
                const currentUnread = getStoredUnreadCount();
                emitUnreadCount(currentUnread + 1);
              }
            }
          }
        });
      }, (err) => {
        console.warn('Firestore onSnapshot notifications error:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Không thể khởi tạo listener Firestore notifications:', err);
    }
  }, [currentUid]);

  // 2. Lắng nghe sự kiện thông báo mới phát ra từ trong ứng dụng (Client / Polling event)
  useEffect(() => {
    const unsub = subscribeNewNotification((notif) => {
      if (notif && notif.id && !seenIdsRef.current.has(notif.id)) {
        seenIdsRef.current.add(notif.id);
        if (!notif.read) {
          triggerBanner(notif);
        }
      }
    });
    return unsub;
  }, []);

  // 3. Đếm ngược thời gian tự động đóng banner (8 giây, tạm dừng khi rê chuột vào)
  useEffect(() => {
    if (!activeNotif) return;

    const intervalTime = 50;
    const decrement = (intervalTime / DURATION_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          const next = prev - decrement;
          if (next <= 0) {
            closeBanner();
            return 0;
          }
          return next;
        });
      }
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeNotif, isPaused]);

  // Xử lý khi người dùng nhấn vào banner hoặc nút "Xem ngay"
  const handleBannerClick = async () => {
    if (!activeNotif) return;
    const notif = activeNotif;
    closeBanner();

    // 1. Đánh dấu đã đọc ngay lập tức và giảm badge
    const newUnread = Math.max(0, getStoredUnreadCount() - 1);
    emitUnreadCount(newUnread);

    try {
      updateDoc(doc(db, 'notifications', notif.id), { read: true }).catch(() => {});
      apiMarkNotificationRead({ notificationId: notif.id, userId: currentUid }).catch(() => {});
    } catch {}

    // 2. Điều hướng chính xác theo loại thông báo
    const senderId = notif.senderId || (notif as any).fromUid;
    const senderName = notif.senderName || (notif as any).fromName;

    if (notif.type === 'match_request') {
      navigate('/match', {
        state: {
          highlightedSenderId: senderId,
          matchRequestNotification: notif,
          openSenderProfile: true,
        },
      });
    } else if (notif.type === 'match_accepted') {
      if (senderId && currentUid) {
        const chatId = [currentUid, senderId].sort().join('_');
        navigate(`/chat/${chatId}`, { state: { chatName: senderName } });
      } else {
        navigate('/chat');
      }
    } else if (notif.type === 'message') {
      const targetChatId = notif.chatId || notif.requestId;
      if (targetChatId) {
        navigate(`/chat/${targetChatId}`);
      } else {
        navigate('/chat');
      }
    } else {
      navigate('/notifications');
    }
  };

  if (!activeNotif || menuOpen) return null;

  const senderName = activeNotif.senderName || (activeNotif as any).fromName || 'Người dùng';
  const senderAvatar = activeNotif.senderAvatar || (activeNotif as any).fromAvatar;
  const bodyText = activeNotif.body || activeNotif.message || 'Bạn vừa có một cập nhật tương hợp mới.';

  const isMatchRequest = activeNotif.type === 'match_request';
  const isMatchAccepted = activeNotif.type === 'match_accepted';
  const isMessage = activeNotif.type === 'message';

  return (
    <AnimatePresence>
      <motion.div
        key={activeNotif.id}
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        className="astrica-notif-banner fixed md:absolute top-[76px] md:top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[70] w-[calc(100vw-24px)] md:w-[450px] max-w-[450px] pointer-events-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="alert"
        aria-live="polite"
      >
        <div
          onClick={handleBannerClick}
          className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group shadow-[0_18px_45px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.38)]"
          style={{
            background: 'linear-gradient(145deg, rgba(28, 16, 58, 0.96) 0%, rgba(18, 10, 38, 0.98) 100%)',
            border: '1px solid rgba(192, 132, 252, 0.45)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
        >
          {/* Ánh sáng glow vũ trụ phía trên */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80"
            aria-hidden="true"
          />

          <div className="p-3.5 flex items-start gap-3">
            {/* Avatar / Biểu tượng phát sáng */}
            <div className="relative flex-shrink-0 mt-0.5">
              {senderAvatar ? (
                <div className="w-11 h-11 rounded-full overflow-hidden border border-purple-400/50 shadow-md bg-purple-950">
                  <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md ${
                    isMatchRequest
                      ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                      : isMatchAccepted
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : isMessage
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}
                >
                  {isMatchRequest && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                  {isMatchAccepted && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {isMessage && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                  {!isMatchRequest && !isMatchAccepted && !isMessage && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                  )}
                </div>
              )}

              {/* Chấm trạng thái phát sáng */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120a26] animate-pulse" />
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isMatchRequest
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-400/30'
                      : isMatchAccepted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : isMessage
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  }`}
                >
                  {isMatchRequest ? 'Lời mời kết đôi' : isMatchAccepted ? 'Ghép đôi thành công' : isMessage ? 'Tin nhắn mới' : 'Thông báo'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeBanner();
                  }}
                  className="p-1 rounded-md text-purple-300/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Đóng banner thông báo"
                  title="Đóng"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                {activeNotif.title}
              </h4>

              <p className="text-xs text-purple-200/80 line-clamp-2 mt-0.5 leading-relaxed">
                {bodyText}
              </p>

              {/* Chân banner với nút hành động */}
              <div className="mt-2 flex items-center justify-between pt-1 border-t border-purple-500/15">
                <span className="text-[10px] text-purple-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping inline-block" />
                  Vừa xong
                </span>

                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white flex items-center gap-1 transition-all shadow-sm"
                  style={{
                    background: isMatchRequest
                      ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                      : isMatchAccepted
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : isMessage
                      ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  }}
                >
                  {isMatchRequest ? 'Xem lời mời' : isMatchAccepted ? 'Nhắn tin ngay' : isMessage ? 'Mở tin nhắn' : 'Xem chi tiết'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Thanh thời gian tự động đóng */}
          <div className="w-full h-[2.5px] bg-purple-950/60 overflow-hidden">
            <div
              className="h-full transition-all duration-75 ease-linear"
              style={{
                width: `${progress}%`,
                background: isMatchRequest
                  ? 'linear-gradient(90deg, #ec4899, #f43f5e)'
                  : isMatchAccepted
                  ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                  : 'linear-gradient(90deg, #a855f7, #ec4899)',
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

