// Couple
export interface Couple {
  id: string;
  coupleCode?: string;
  spouseIds: string[];
  emails?: string[];
  weddingDate?: any; // Firestore Timestamp
  anniversary?: any;
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
}

// Memory
export interface Memory {
  id: string;
  coupleId: string;
  type: 'photo' | 'video' | 'audio' | 'note';
  mediaUrl?: string;
  caption: string;
  tags: string[];
  emotion?: string;
  date: any;
  likes: string[];
  isLocked: boolean;
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

export type AppTheme = 'Moonlit Night' | 'Desert Rose' | 'Ocean Calm' | 'Golden Dusk';
