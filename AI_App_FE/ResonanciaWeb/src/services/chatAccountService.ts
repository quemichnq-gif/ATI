import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { UserProfile } from '../types';

export interface ChatAccountIdentity {
  uid: string;
  name: string;
  avatar: string;
  zodiac?: string;
  job?: string;
  isMainUser: boolean;
}

const STORAGE_KEY = 'resonancia_active_chat_identity';
const MAIN_BACKUP_KEY = 'resonancia_main_user_backup';

/**
 * Lấy danh sách các tài khoản có thể chuyển đổi trong hệ thống
 */
export function getAvailableChatAccounts(mainProfile: UserProfile): ChatAccountIdentity[] {
  // 1. Tài khoản chính của người dùng
  const effectiveMainUid = mainProfile.uid || 'user_main_tuan';
  const effectiveMainName = mainProfile.name || 'Tuấn Nguyễn Chí';
  const effectiveMainAvatar =
    mainProfile.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const mainAccount: ChatAccountIdentity = {
    uid: effectiveMainUid,
    name: effectiveMainName,
    avatar: effectiveMainAvatar,
    zodiac: (mainProfile as any).zodiac || mainProfile.sun || 'Bọ Cạp',
    job: 'Thành viên Resonancia',
    isMainUser: true,
  };

  // Lưu backup tài khoản chính nếu chưa có
  try {
    const existing = localStorage.getItem(MAIN_BACKUP_KEY);
    if (!existing || (mainProfile.uid && !existing.includes(mainProfile.uid))) {
      localStorage.setItem(MAIN_BACKUP_KEY, JSON.stringify(mainAccount));
    }
  } catch {}

  // 2. Các ứng viên hệ thống
  const candidateAccounts: ChatAccountIdentity[] = Object.values(DEFAULT_CANDIDATE_PROFILES).map((cand) => ({
    uid: cand.uid,
    name: cand.name,
    avatar: cand.avatar,
    zodiac: cand.zodiac || cand.sun,
    job: cand.job,
    isMainUser: false,
  }));

  return [mainAccount, ...candidateAccounts];
}

/**
 * Lấy danh tính chat hiện tại
 */
export function getActiveChatIdentity(mainProfile: UserProfile): ChatAccountIdentity {
  const accounts = getAvailableChatAccounts(mainProfile);
  try {
    const savedUid = localStorage.getItem(STORAGE_KEY);
    if (savedUid) {
      const found = accounts.find((a) => a.uid === savedUid);
      if (found) return found;
    }
  } catch {}
  return accounts[0]; // Mặc định là tài khoản chính
}

/**
 * Đổi danh tính chat sang tài khoản khác
 */
export function setActiveChatIdentity(uid: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, uid);
    window.dispatchEvent(new CustomEvent('resonancia_identity_changed', { detail: { uid } }));
  } catch {}
}
