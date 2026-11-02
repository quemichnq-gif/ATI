export function getVietnameseDate(type: 'today' | 'tomorrow' = 'today') {
  const d = new Date();
  if (type === 'tomorrow') d.setDate(d.getDate() + 1);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTimestamp(ts: any): string {
  if (!ts) return 'Vừa xong';
  let ms: number;
  if (typeof ts === 'number') {
    ms = ts;
  } else if (typeof ts === 'string') {
    const safeStr = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
    const parsed = Date.parse(safeStr);
    ms = isNaN(parsed) ? Date.now() : parsed;
  } else if (typeof ts === 'object') {
    if (typeof ts.toDate === 'function') {
      try {
        ms = ts.toDate().getTime();
      } catch {
        ms = Date.now();
      }
    } else if (typeof ts.seconds === 'number') {
      ms = ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1000000);
    } else if (typeof ts._seconds === 'number') {
      ms = ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1000000);
    } else {
      ms = Date.now();
    }
  } else {
    ms = Date.now();
  }

  const d = new Date(ms);
  if (isNaN(d.getTime())) return 'Vừa xong';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 0 || diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  try {
    return d.toLocaleDateString('vi-VN');
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
