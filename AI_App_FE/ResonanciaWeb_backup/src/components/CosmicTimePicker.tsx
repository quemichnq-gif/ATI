import React, { useMemo } from 'react';

interface CosmicTimePickerProps {
  id?: string;
  value: string; // HH:mm (24h format, e.g. "03:20" or "15:20")
  onChange: (val: string) => void;
  className?: string;
}

export default function CosmicTimePicker({
  id,
  value,
  onChange,
  className = '',
}: CosmicTimePickerProps) {
  // Parse current value (24h format HH:mm) into 12h + period (AM/PM)
  const { hour12, minute, period } = useMemo(() => {
    let h = 0;
    let m = 0;
    if (value && value.includes(':')) {
      const parts = value.split(':');
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;
    }
    const isPM = h >= 12;
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour12: h12.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      period: isPM ? 'PM' : 'AM',
    };
  }, [value]);

  const updateTime = (newH12: string, newMin: string, newPeriod: string) => {
    let h = parseInt(newH12, 10);
    const m = parseInt(newMin, 10);
    if (newPeriod === 'PM') {
      if (h < 12) h += 12;
    } else {
      if (h === 12) h = 0;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={`space-y-2 ${className}`}>
      {/* iOS styled glass time wheel controls */}
      <div
        id={id}
        className="flex items-center justify-between gap-2 p-2 rounded-2xl glass"
        style={{
          background: 'rgba(26, 16, 60, 0.65)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Hour selector */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[11px] text-purple-300/70 font-medium mb-1">Giờ</span>
          <div className="relative w-full">
            <select
              aria-label="Chọn giờ sinh"
              value={hour12}
              onChange={(e) => updateTime(e.target.value, minute, period)}
              className="w-full text-center text-lg font-bold text-white bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/30 rounded-xl py-2 px-1 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 cursor-pointer transition-all appearance-none"
            >
              {hoursList.map((h) => (
                <option key={h} value={h} className="bg-slate-900 text-white py-1">
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Separator */}
        <span className="text-xl font-bold text-purple-300/60 pb-1 select-none animate-pulse">:</span>

        {/* Minute selector */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[11px] text-purple-300/70 font-medium mb-1">Phút</span>
          <div className="relative w-full">
            <select
              aria-label="Chọn phút sinh"
              value={minute}
              onChange={(e) => updateTime(hour12, e.target.value, period)}
              className="w-full text-center text-lg font-bold text-white bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/30 rounded-xl py-2 px-1 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 cursor-pointer transition-all appearance-none"
            >
              {minutesList.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white py-1">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AM / PM Segmented Control - Bấm 1 click là đổi, không cần gõ phím */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[11px] text-purple-300/70 font-medium mb-1">Buổi</span>
          <div className="flex w-full p-1 bg-purple-950/80 rounded-xl border border-purple-500/30">
            <button
              type="button"
              onClick={() => updateTime(hour12, minute, 'AM')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'AM'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              SA (AM)
            </button>
            <button
              type="button"
              onClick={() => updateTime(hour12, minute, 'PM')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'PM'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              CH (PM)
            </button>
          </div>
        </div>
      </div>

      {/* Helper text with parsed 24h preview */}
      <div className="flex items-center justify-between text-xs text-purple-300/70 px-1">
        <span>Định dạng 24h: <strong className="text-purple-200 font-mono">{value || '00:00'}</strong></span>
        <span>{period === 'AM' ? 'Sáng sớm / Ban mai' : 'Chiều / Tối'}</span>
      </div>
    </div>
  );
}
