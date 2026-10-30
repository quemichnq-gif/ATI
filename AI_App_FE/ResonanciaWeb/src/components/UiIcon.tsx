import type { ReactNode } from 'react';

export type IconName =
  | 'home' | 'chart' | 'search' | 'message' | 'bell' | 'user' | 'logout'
  | 'calendar' | 'clock' | 'pin' | 'briefcase' | 'heart' | 'ruler' | 'scale'
  | 'camera' | 'edit' | 'check' | 'hourglass' | 'send' | 'sparkles'
  | 'compass' | 'flame' | 'earth' | 'wind' | 'water' | 'arrow-up'
  | 'sun' | 'moon' | 'star' | 'rocket' | 'close' | 'cloud-rain' | 'mail';

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  chart: <><circle cx="12" cy="12" r="9"/><path d="M12 3v9l7 5M5 18l7-6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  message: <><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.1-4.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8M8 14h5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
  heart: <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/>,
  ruler: <><path d="m3 17 14-14 4 4L7 21z"/><path d="m14 6 4 4M10 10l2 2M6 14l2 2"/></>,
  scale: <><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM8 21h8"/></>,
  camera: <><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  hourglass: <><path d="M5 3h14M5 21h14M7 3v4a5 5 0 0 0 5 5 5 5 0 0 0-5 5v4M17 3v4a5 5 0 0 1-5 5 5 5 0 0 1 5 5v4"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15Z"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
  flame: <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-1 3-3 4-4 5-1-2-2-3-2-5-3 4-5 7-5 10a8 8 0 0 0 8 7Z"/>,
  earth: <><circle cx="12" cy="12" r="9"/><path d="M3.5 9h5l2 2-1 3 2 2 2-1 1-4 4-2M10 3.5l1 3 3 1"/></>,
  wind: <><path d="M3 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h7"/></>,
  water: <path d="M12 3C9 8 6 11 6 15a6 6 0 0 0 12 0c0-4-3-7-6-12Z"/>,
  'arrow-up': <><path d="m5 12 7-7 7 7M12 19V5"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>,
  rocket: <><path d="M5 15c-1 1-2 4-2 4s3-1 4-2M9 14l-3-3c2-5 7-8 13-8 0 6-3 11-8 13l-2-2Z"/><circle cx="15" cy="9" r="1.5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  'cloud-rain': <><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4 4 0 1 1 1 9H7Z"/><path d="m8 18-1 3m6-3-1 3m6-3-1 3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
};

export default function UiIcon({ name, label, className = '' }: { name: IconName; label: string; className?: string }) {
  return <svg aria-label={label} role="img" className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
