import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { RootState } from '../store';
import { auth, db } from '../services/firebase';
import {
  apiGetNotifications,
  apiMarkNotificationRead,
  apiDeleteNotification,
  apiAcceptMatch,
  apiRejectMatch,
} from '../services/api';
import { initializeChatRoom } from '../services/realtimeChatService';
import { formatTimestamp } from '../utils/date';
import { Notification } from '../types';
import UiIcon from '../components/UiIcon';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';

const NOTIF_ICONS: Record<string, 'mail' | 'check' | 'heart' | 'cloud-rain' | 'message'> = {
  match_request: 'mail',
  match_accepted: 'check',
  match_rejected: 'heart',
  breakup: 'cloud-rain',
  message: 'message',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);
  const currentUid = profile.uid || auth.currentUser?.uid || '';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'message' | 'match'>('all');
  const [acceptedMap, setAcceptedMap] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');

  const fetchNotifications = useCallback(async (showLoading = false, overrideUid?: string) => {
    const uidToUse = overrideUid || currentUid || auth.currentUser?.uid;
    if (!uidToUse) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await apiGetNotifications(uidToUse);
      const list = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(list);
    } catch (err) {
      console.warn('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUid]);

  useEffect(() => {
    fetchNotifications(true);
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        fetchNotifications(false, user.uid);
      }
    });

    // Tự động kiểm tra thông báo mới định kỳ mỗi 5 giây
    const timer = setInterval(() => {
      fetchNotifications(false);
    }, 5000);
    const handleFocus = () => fetchNotifications(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubAuth();
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await apiMarkNotificationRead({ notificationId: id, userId: currentUid });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn('Lỗi đánh dấu đã đọc:', e);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    try {
      await apiMarkNotificationRead({ notificationIds: unreadIds, userId: currentUid });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Lỗi đánh dấu tất cả đã đọc:', e);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await apiDeleteNotification({ notificationId: id, userId: currentUid });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.warn('Lỗi xóa thông báo:', e);
    }
  };

  const deleteAllNotifs = async () => {
    if (!notifications.length) return;
    const toDelete = [...notifications];
    // Xóa ngay trên UI cho mượt
    setNotifications([]);
    setToastMsg('Đã xóa tất cả thông báo');
    setTimeout(() => setToastMsg(''), 3000);
    // Gọi API xóa từng cái (backend chưa có batch delete)
    for (const n of toDelete) {
      try {
        await apiDeleteNotification({ notificationId: n.id, userId: currentUid });
      } catch {
        // bỏ qua lỗi từng cái
      }
    }
  };

  const handleAcceptFromNotification = async (n: Notification) => {
    if (!n?.id) return;
    const senderUid = n.senderId || n.fromUid || (n as any).sender_id;
    const sName = n.senderName || n.fromName || (n as any).sender_name || 'Người dùng';

    const testUser = (senderUid ? getTestProfileByEmailOrUid(senderUid) : null) ||
                     (sName ? getTestProfileByEmailOrUid(sName) : null);
    const targetUid = senderUid || testUser?.uid;
    const myUid = currentUid || auth.currentUser?.uid || profile.uid;

    if (!targetUid || !myUid) return;

    setActionLoading(prev => ({ ...prev, [n.id]: true }));
    try {
      await apiAcceptMatch({
        requestId: n.requestId,
        receiverId: myUid,
        senderId: targetUid,
        uid: myUid,
        targetUid,
      });

      try {
        const reqId = n.requestId || `${targetUid}_${myUid}`;
        await setDoc(doc(db, 'match_requests', reqId), {
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
        }, { merge: true });
      } catch {}

      setAcceptedMap(prev => ({ ...prev, [n.id]: true }));
      markRead(n.id);
      setToastMsg(`Đã đồng ý kết bạn với ${sName}! ✨`);
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      console.error('Lỗi chấp nhận kết đôi từ thông báo:', err);
      setAcceptedMap(prev => ({ ...prev, [n.id]: true }));
      markRead(n.id);
      setToastMsg(`Đã kết nối cùng ${sName}! ✨`);
      setTimeout(() => setToastMsg(''), 3500);
    } finally {
      setActionLoading(prev => ({ ...prev, [n.id]: false }));
    }
  };

  const handleRejectFromNotification = async (n: Notification) => {
    if (!n?.id) return;
    const senderUid = n.senderId || n.fromUid || (n as any).sender_id;
    const sName = n.senderName || n.fromName || (n as any).sender_name || 'Người dùng';
    const testUser = (senderUid ? getTestProfileByEmailOrUid(senderUid) : null) ||
                     (sName ? getTestProfileByEmailOrUid(sName) : null);
    const targetUid = senderUid || testUser?.uid;
    const myUid = currentUid || auth.currentUser?.uid || profile.uid;

    setActionLoading(prev => ({ ...prev, [n.id]: true }));
    try {
      if (myUid && targetUid) {
        await apiRejectMatch({
          requestId: n.requestId,
          receiverId: myUid,
          senderId: targetUid,
          uid: myUid,
          targetUid,
        });
      }
      markRead(n.id);
      setNotifications(prev => prev.filter(item => item.id !== n.id));
      setToastMsg(`Đã từ chối lời mời từ ${sName}`);
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      console.error('Lỗi từ chối kết bạn:', err);
      setNotifications(prev => prev.filter(item => item.id !== n.id));
    } finally {
      setActionLoading(prev => ({ ...prev, [n.id]: false }));
    }
  };

  const handleStartChatWithSender = async (n: Notification) => {
    const senderUid = n.senderId || n.fromUid || (n as any).sender_id;
    const sName = n.senderName || n.fromName || (n as any).sender_name || 'Người dùng';
    const sAvatar = n.senderAvatar || n.fromAvatar || (n as any).sender_avatar || '';
    const testUser = (senderUid ? getTestProfileByEmailOrUid(senderUid) : null) ||
                     (sName ? getTestProfileByEmailOrUid(sName) : null);
    const targetUid = senderUid || testUser?.uid;
    const myUid = currentUid || auth.currentUser?.uid || profile.uid;

    if (!myUid || !targetUid) return;

    const myTest = getTestProfileByEmailOrUid(myUid);
    const canonicalMyUid = myTest?.uid || myUid;
    const canonicalTargetUid = testUser?.uid || targetUid;
    const chatId = [canonicalMyUid, canonicalTargetUid].sort().join('_');

    try {
      await initializeChatRoom({
        chatId,
        participants: [canonicalMyUid, canonicalTargetUid],
        participantNames: {
          [canonicalMyUid]: profile.name || auth.currentUser?.displayName || 'Người dùng',
          [canonicalTargetUid]: testUser?.name || sName,
        },
        participantAvatars: {
          [canonicalMyUid]: profile.avatar || auth.currentUser?.photoURL || '',
          [canonicalTargetUid]: testUser?.avatar || sAvatar,
        },
        lastMessage: 'Đã kết bạn thành công ✨',
      });
    } catch (e) {
      console.error('Error starting chat:', e);
    }
    navigate(`/chat/${chatId}`, { state: { chatName: testUser?.name || sName } });
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n?.id) return;
    if (!n.read) {
      markRead(n.id);
    }
    // Chuyển hướng phù hợp theo loại thông báo
    if (n.type === 'message') {
      const targetChatId = (n as any).chatId || n.requestId;
      if (targetChatId) {
        navigate(`/chat/${targetChatId}`);
      } else {
        navigate('/chat');
      }
    } else if (n.type === 'match_request') {
      const senderUid = n.senderId || n.fromUid || (n as any).sender_id;
      const sName = n.senderName || n.fromName || (n as any).sender_name;
      const sAvatar = n.senderAvatar || n.fromAvatar || (n as any).sender_avatar;

      // Tìm test account nếu có
      const testUser = (senderUid ? getTestProfileByEmailOrUid(senderUid) : null) ||
                       (sName ? getTestProfileByEmailOrUid(sName) : null);
      const targetUid = senderUid || testUser?.uid;

      if (targetUid) {
        navigate(`/user/${targetUid}`, {
          state: {
            candidate: {
              uid: targetUid,
              name: testUser?.name || sName || 'Người dùng Resonancia',
              avatar: testUser?.avatar || sAvatar || '',
              sun: testUser?.sun || 'Bọ Cạp',
              moon: testUser?.moon || 'Kim Ngưu',
              ascendant: testUser?.ascendant || 'Nhân Mã',
              bio: testUser?.bio || '',
              job: testUser?.job || 'Thành viên Resonancia',
            },
            isReceivedRequest: true,
            requestId: n.requestId,
          }
        });
      } else {
        navigate('/match');
      }
    } else if (n.type === 'match_accepted') {
      navigate('/chat');
    }
  };

  const counts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    message: notifications.filter(n => n.type === 'message').length,
    match: notifications.filter(n => n.type === 'match_request' || n.type === 'match_accepted' || n.type === 'match_rejected').length,
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'message') return n.type === 'message';
    if (activeTab === 'match') return n.type === 'match_request' || n.type === 'match_accepted' || n.type === 'match_rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">
          <UiIcon name="bell" label="Thông báo" className="mr-2 inline" />Thông Báo
        </h1>
        <p className="text-purple-300 opacity-70 mt-1">
          {counts.unread > 0 ? `${counts.unread} thông báo chưa đọc` : 'Tất cả đã đọc'}
        </p>
      </motion.div>

      {/* Thanh phân loại & thao tác nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'Tất cả', count: counts.all },
            { key: 'unread', label: 'Chưa đọc', count: counts.unread },
            { key: 'message', label: 'Tin nhắn', count: counts.message },
            { key: 'match', label: 'Lời mời kết đôi', count: counts.match },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/[0.05] text-purple-200/70 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-purple-500/30 text-purple-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {counts.unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-purple-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={deleteAllNotifs}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/40 transition-all cursor-pointer flex items-center gap-1.5"
              title="Xóa hết thông báo"
              aria-label="Xóa hết thông báo"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Xóa hết
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchNotifications(false)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl text-purple-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
            title="Làm mới thông báo"
            aria-label="Làm mới thông báo"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-800/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-purple-800/40 rounded w-2/3" />
                  <div className="h-3 bg-purple-800/20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4"><UiIcon name="bell" label="Không có thông báo" /></div>
          <p className="text-white font-semibold">
            {activeTab === 'unread'
              ? 'Không có thông báo chưa đọc nào'
              : activeTab === 'message'
              ? 'Chưa có thông báo tin nhắn nào'
              : activeTab === 'match'
              ? 'Chưa có lời mời kết đôi nào'
              : 'Không có thông báo nào'}
          </p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">Vũ trụ đang yên lặng...</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n, i) => {
              const bodyText = n?.body || (n as any)?.message;
              const senderAvatar = (n as any)?.senderAvatar;
              const senderName = (n as any)?.senderName;
              return (
                <motion.div
                  key={n?.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card p-4 cursor-pointer transition-all hover:bg-white/[0.07] ${
                    !n?.read ? 'border-purple-500/40 bg-purple-900/15' : ''
                  }`}
                  style={!n?.read ? { border: '1px solid rgba(168, 85, 247, 0.35)', background: 'rgba(147, 51, 234, 0.08)' } : {}}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative flex-shrink-0 mt-0.5">
                      {senderAvatar ? (
                        <div className="w-11 h-11 rounded-full overflow-hidden border border-purple-400/40 shadow-sm bg-purple-950">
                          <img src={senderAvatar} alt={senderName || ''} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-purple-800/40 border border-purple-400/20 flex items-center justify-center text-xl text-purple-200">
                          <UiIcon name={NOTIF_ICONS[n?.type || ''] || 'bell'} label={n?.title || 'Thông báo'} />
                        </div>
                      )}
                      {/* Huy hiệu loại thông báo */}
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow border border-[#100a2a] ${
                        n?.type === 'message'
                          ? 'bg-blue-500'
                          : n?.type === 'match_request'
                          ? 'bg-pink-500'
                          : 'bg-emerald-500'
                      }`}>
                        <UiIcon name={NOTIF_ICONS[n?.type || ''] || 'bell'} label="" className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold text-sm ${n?.read ? 'text-purple-200' : 'text-white font-bold'}`}>
                            {n?.title || 'Thông báo mới'}
                          </h3>
                          {!n?.read && (
                            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse flex-shrink-0" />
                          )}
                          {n?.type === 'message' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              Tin nhắn
                            </span>
                          )}
                          {n?.type === 'match_request' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                              Lời mời kết đôi
                            </span>
                          )}
                          {n?.type === 'match_accepted' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              Đã ghép đôi
                            </span>
                          )}
                        </div>
                        <span className="text-purple-400 text-xs flex-shrink-0">
                          {formatTimestamp(n?.createdAt)}
                        </span>
                      </div>

                      {bodyText && (
                        <p className="text-purple-200/80 text-xs mt-1 leading-relaxed">
                          {bodyText}
                        </p>
                      )}

                      {/* Gợi ý hành động nhanh */}
                      <div className="mt-2.5">
                        {n?.type === 'message' && (
                          <span className="text-[11px] text-cyan-300 hover:text-cyan-200 font-medium inline-flex items-center gap-1">
                            Bấm để mở cuộc trò chuyện
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                          </span>
                        )}
                        {n?.type === 'match_request' && (
                          acceptedMap[n.id] ? (
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs text-emerald-300 font-semibold inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                <UiIcon name="check" label="Đã đồng ý" className="inline text-emerald-400" />
                                Đã đồng ý kết bạn! ✨
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChatWithSender(n);
                                }}
                                className="btn-cosmic px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 text-white shadow-sm cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                              >
                                <UiIcon name="message" label="Nhắn tin" className="inline" />
                                Nhắn Tin Ngay
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={actionLoading[n.id]}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptFromNotification(n);
                                }}
                                className="btn-cosmic px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                              >
                                {actionLoading[n.id] ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <UiIcon name="check" label="Đồng ý" className="inline text-green-300" />
                                    <span>Đồng Ý Kết Bạn</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={actionLoading[n.id]}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectFromNotification(n);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-purple-300/80 hover:text-rose-300 glass hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                Từ Chối
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(n);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-purple-200 hover:text-white glass hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Xem hồ sơ</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                              </button>
                            </div>
                          )
                        )}
                        {n?.type === 'match_accepted' && (
                          <span className="text-[11px] text-emerald-300 hover:text-emerald-200 font-medium inline-flex items-center gap-1">
                            Bấm để mở cuộc trò chuyện
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                          </span>
                        )}
                      </div>
                    </div>

                    {n?.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif(n.id);
                        }}
                        className="p-1 rounded-lg text-purple-400/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0 cursor-pointer"
                        title="Xóa thông báo"
                        aria-label="Xóa thông báo"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {/* Floating Toast Feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 glass-card px-4 py-3 border border-purple-500/40 shadow-2xl flex items-center gap-2 text-sm text-white"
            style={{ background: 'rgba(26, 0, 48, 0.95)' }}
          >
            <UiIcon name="sparkles" label="Thông báo" className="text-yellow-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
