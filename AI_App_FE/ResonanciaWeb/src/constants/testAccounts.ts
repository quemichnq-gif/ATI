/**
 * Danh sách tài khoản thử nghiệm chuẩn cho Resonancia
 * Dùng để test tính năng Chat Messenger 2 chiều thực tế
 */

export interface TestAccountInfo {
  email: string;
  name: string;
  zodiac: string;
  sun: string;
  moon: string;
  ascendant: string;
  avatar: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  job: string;
  bio: string;
  uid?: string;
  aliasUids?: string[];
}

export const TEST_ACCOUNTS: Record<string, TestAccountInfo> = {
  'hamy@resonancia.app': {
    email: 'hamy@resonancia.app',
    name: 'Hà My',
    zodiac: 'Song Ngư',
    sun: 'Song Ngư',
    moon: 'Cự Giải',
    ascendant: 'Bọ Cạp',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    gender: 'female',
    birthDate: '2001-03-12',
    birthTime: '10:15',
    birthPlace: 'Hà Nội',
    job: 'Thành viên Resonancia',
    bio: 'Thích vẽ tranh, nghe podcast chiêm tinh và đi dạo ngắm hoàng hôn 🎨✨',
    uid: '61kO1itQCOV3Nw9acgWUmQLduNT2',
    aliasUids: ['cand_2_hamy', '61kO1itQCOV3Nw9acgWUmQLduNT2'],
  },
  'tuan@resonancia.app': {
    email: 'tuan@resonancia.app',
    name: 'Tuấn Nguyễn Chí',
    zodiac: 'Bọ Cạp',
    sun: 'Bọ Cạp',
    moon: 'Kim Ngưu',
    ascendant: 'Nhân Mã',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    gender: 'male',
    birthDate: '1998-11-05',
    birthTime: '08:30',
    birthPlace: 'Hà Nội',
    job: 'Thành viên Resonancia',
    bio: 'Người tìm kiếm sự hòa hợp giữa các vì sao và cuộc sống ✨',
    uid: 'yEQyrTCQJwWedUyffYTqt5O01ih1',
    aliasUids: ['user_main_tuan', 'yEQyrTCQJwWedUyffYTqt5O01ih1'],
  },
  'dainghia@resonancia.app': {
    email: 'dainghia@resonancia.app',
    name: 'Trần Đại Nghĩa',
    zodiac: 'Bảo Bình',
    sun: 'Bảo Bình',
    moon: 'Song Tử',
    ascendant: 'Thiên Bình',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    gender: 'male',
    birthDate: '1996-02-14',
    birthTime: '14:20',
    birthPlace: 'Đà Nẵng',
    job: 'Thành viên Resonancia',
    bio: 'Đam mê khám phá vũ trụ và công nghệ AI 🌌',
    uid: 'YykBl98StbXVCKgqave6VMVC5Bx1',
    aliasUids: ['cand_1_dainghia', 'YykBl98StbXVCKgqave6VMVC5Bx1'],
  },
};

/**
 * Lấy cấu hình hồ sơ test account theo email hoặc UID
 */
export function getTestProfileByEmailOrUid(emailOrUid: string): TestAccountInfo | null {
  if (!emailOrUid) return null;
  const lower = emailOrUid.toLowerCase();
  for (const account of Object.values(TEST_ACCOUNTS)) {
    if (
      account.email.toLowerCase() === lower ||
      account.uid === emailOrUid ||
      account.aliasUids?.includes(emailOrUid)
    ) {
      return account;
    }
  }
  return null;
}
