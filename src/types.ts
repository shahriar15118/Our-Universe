// Couple
export interface Couple {
  id: string;
  coupleCode?: string;
  spouseIds: string[];
  emails?: string[];
  weddingDate?: any; // Firestore Timestamp
  anniversary?: any;
  partnerPhotoUrl?: string;
  theme: 'Moonlit Night' | 'Desert Rose' | 'Ocean Calm' | 'Golden Dusk';
  createdAt: any;
  deenStreak?: number;
  lastDeenDate?: string; // YYYY-MM-DD
}

// UserProfile
export interface UserProfile {
  userId: string;
  coupleId: string;
  name: string;
  email: string;
  spouseEmail?: string;
  photoUrl?: string;
  role?: 'husband' | 'wife';
  quranProgress?: number; // Total number of ayahs read
  reminderSettings?: Record<string, boolean>;
}

// Memory
export interface Memory {
  id: string;
  coupleId: string;
  authorId: string;
  type: 'photo' | 'video' | 'audio' | 'note' | 'milestone';
  mediaUrl?: string;
  title: string;
  caption: string;
  tags: string[];
  emotion?: string;
  date: string; // ISO String
  likes: string[];
  isLocked: boolean;
  comments?: {
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
}

// Letter
export interface Letter {
  id: string;
  coupleId: string;
  authorId: string;
  category: string;
  title: string;
  contentEncrypted: string;
  isOpened: boolean;
  openedAt?: any;
  scheduledFor?: any;
  createdAt: any;
}

// Emotion Guidance
export interface EmotionVerse {
  emotion: string;
  arabicText: string;
  surah: string;
  verseRef: string;
  translationEN: string;
  translationBN: string;
  tafsir: string;
  reflection: string;
  dua: { arabic: string; translation: string; };
  audioUrl?: string;
}

// Daily Secret
export interface DailySecret {
  id: string;
  coupleId: string;
  authorId: string;
  text: string;
  date: string; // YYYY-MM-DD
  isRevealed: boolean;
  createdAt: any;
}

export interface Mood {
  id?: string;
  userId: string;
  emotionId: string;
  date: string; // YYYY-MM-DD
  timestamp: any;
  verse?: {
    ayah: string;
    ref: string;
    trans: string;
    tafsir: string;
    dua?: {
      arabic: string;
      trans: string;
      bangla: string;
    };
  };
  expiresAt?: any;
}

export type AppTheme = 'Moonlit Night' | 'Desert Rose' | 'Ocean Calm' | 'Golden Dusk';
