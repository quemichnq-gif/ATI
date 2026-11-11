export const NOTIFICATIONS_CHANGED_EVENT = 'resonancia_notifications_changed';
export const NEW_NOTIFICATION_EVENT = 'resonancia_new_notification';

export function emitUnreadCount(count: number): void {
  try {
    localStorage.setItem('resonancia_unread_notifs', count.toString());
  } catch {}
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, { detail: count }));
}

export function getStoredUnreadCount(): number {
  try {
    const val = localStorage.getItem('resonancia_unread_notifs');
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function subscribeUnreadCount(callback: (count: number) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (typeof customEvent.detail === 'number') {
      callback(customEvent.detail);
    }
  };
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
}

export function emitNewNotification(notif: any): void {
  if (!notif) return;
  window.dispatchEvent(new CustomEvent(NEW_NOTIFICATION_EVENT, { detail: notif }));
}

export function subscribeNewNotification(callback: (notif: any) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<any>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener(NEW_NOTIFICATION_EVENT, handler);
  return () => window.removeEventListener(NEW_NOTIFICATION_EVENT, handler);
}
