import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGetNotifications, apiMarkNotificationRead, apiDeleteNotification } from '../services/api';
import { formatTimestamp } from '../utils/date';
import { Notification } from '../types';
import UiIcon from '../components/UiIcon';

const NOTIF_ICONS: Record<string, 'mail' | 'check' | 'heart' | 'cloud-rain' | 'message'> = {
  match_request: 'mail',
  match_accepted: 'check',
  match_rejected: 'heart',
  breakup: 'cloud-rain',
  message: 'message',
};

export default function NotificationsPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGetNotifications(profile.uid)
      .then(res => {
        const list = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
        setNotifications(list);
      })
      .catch((err) => {
        console.warn('Lỗi tải thông báo:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [profile.uid]);

  const markRead = async (id: string) => {
    try {
      await apiMarkNotificationRead({ notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn('Lỗi đánh dấu đã đọc:', e);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await apiDeleteNotification({ notificationId: id });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.warn('Lỗi xóa thông báo:', e);
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="bell" label="Thông báo" className="mr-2 inline" />Thông Báo</h1>
        <p className="text-purple-300 opacity-70 mt-1">
          {unread > 0 ? `${unread} thông báo chưa đọc` : 'Tất cả đã đọc'}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
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
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4"><UiIcon name="bell" label="Không có thông báo" /></div>
          <p className="text-white font-semibold">Không có thông báo nào</p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">Vũ trụ đang yên lặng...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div key={n?.id || i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 cursor-pointer transition-all ${
                  !n?.read ? 'border-purple-500/30' : ''
                }`}
                style={!n?.read ? { border: '1px solid rgba(157,78,221,0.3)', background: 'rgba(157,78,221,0.05)' } : {}}
                onClick={() => n?.id && !n.read && markRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    <UiIcon name={NOTIF_ICONS[n?.type || ''] || 'bell'} label={n?.title || 'Thông báo'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold text-sm ${n?.read ? 'text-purple-300' : 'text-white'}`}>
                        {n?.title || 'Thông báo mới'}
                        {!n?.read && <span className="ml-2 w-2 h-2 rounded-full bg-pink-400 inline-block" />}
                      </h3>
                      <span className="text-purple-400 text-xs flex-shrink-0">
                        {formatTimestamp(n?.createdAt)}
                      </span>
                    </div>
                    {n?.body && <p className="text-purple-300 text-xs mt-0.5 opacity-80">{n.body}</p>}
                  </div>
                  {n?.id && (
                    <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                      className="text-purple-500 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                      aria-label="Xóa thông báo">
                      ✕
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
