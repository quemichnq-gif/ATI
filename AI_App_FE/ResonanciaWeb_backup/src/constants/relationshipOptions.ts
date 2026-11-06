export const RELATIONSHIP_OPTIONS = [
  { id: 'Độc thân', label: 'Độc thân', iconType: 'single', desc: 'Đang tìm kiếm một nửa' },
  { id: 'Đang trong mối quan hệ', label: 'Đang trong\nmối quan hệ', iconType: 'in_relationship', desc: 'Đang hẹn hò, gắn kết' },
  { id: 'Sống chung', label: 'Sống chung', iconType: 'cohabiting', desc: 'Chung một mái nhà' },
  { id: 'Đã đính hôn', label: 'Đã đính hôn', iconType: 'engaged', desc: 'Chuẩn bị về một nhà' },
  { id: 'Đã kết hôn', label: 'Đã kết hôn', iconType: 'married', desc: 'Đã kết duyên trăm năm' },
  { id: 'Ly thân', label: 'Ly thân', iconType: 'separated', desc: 'Đang tạm thời tách rời' },
  { id: 'Đã ly hôn', label: 'Đã ly hôn', iconType: 'divorced', desc: 'Mở lòng đón khởi đầu mới' },
  { id: 'Góa', label: 'Góa', iconType: 'widowed', desc: 'Trân trọng ký ức thiêng liêng' },
  { id: 'Mối quan hệ phức tạp', label: 'Mối quan hệ\nphức tạp', iconType: 'complicated', desc: 'Cần sự thấu hiểu & duyên số' },
] as const;
