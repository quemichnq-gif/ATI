export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  avatar?: string;
  coverImage?: string;
  height?: number;
  weight?: number;
  job?: string;
  relationshipStatus?: string;
  profileComplete?: boolean;
  // Planets
  sun?: string;
  moon?: string;
  mercury?: string;
  venus?: string;
  mars?: string;
  jupiter?: string;
  saturn?: string;
  uranus?: string;
  neptune?: string;
  pluto?: string;
  ascendant?: string;
  descendant?: string;
  mc?: string;
  ic?: string;
  // Houses
  house1?: string; house2?: string; house3?: string; house4?: string;
  house5?: string; house6?: string; house7?: string; house8?: string;
  house9?: string; house10?: string; house11?: string; house12?: string;
  // Aspects
  conjunctionAspect?: string;
  oppositionAspect?: string;
  trineAspect?: string;
  squareAspect?: string;
  sextileAspect?: string;
  // Natal chart
  natalChartImage?: string;
  // Elements
  fireRatio?: number;
  earthRatio?: number;
  airRatio?: number;
  waterRatio?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars?: Record<string, string>;
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount?: number;
}

export interface MatchRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  responseMessage?: string;
}

export interface Notification {
  id: string;
  uid: string;
  type: 'match_request' | 'match_accepted' | 'match_rejected' | 'breakup' | 'message';
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  fromUid?: string;
  fromName?: string;
  fromAvatar?: string;
  requestId?: string;
}

export interface CompatibilityScores {
  overall: number;
  love: number;
  trust: number;
  communication: number;
  marriage: number;
}

export interface LoveMatchCandidate {
  uid: string;
  name: string;
  sun?: string;
  moon?: string;
  avatar?: string;
  zodiac?: string;
  reason?: string;
  score?: number;
}

export interface PredictionResult {
  prediction: string;
  cached: boolean;
}

export interface NatalAnalysis {
  analysis: string;
  cached: boolean;
}

export interface CompatibilityAnalysis {
  analysis: string;
  scores: CompatibilityScores;
  cached: boolean;
}

export type MatchTagType = 'greenflag' | 'redflag' | 'karmic' | 'destiny' | 'twinflame';

export type PredictionCategory = 'astro' | 'love' | 'work' | 'love_metrics';
