# 🌙 Our Whisper - Islamic Spiritual Companion for Couples

**Our Whisper** is an ambient, deeply spiritual companion application designed specifically for married couples. Built upon the pristine principles of the Qur'an and Sunnah, the application aims to nurture **Mawaddah** (affection) and **Rahmah** (mercy) between spouses by helping them grow, track, and elevate their daily spiritual habits together in beautiful harmony.

---

## 🌟 Core Purpose & Mission (প্রজেক্টের মূল উদ্দেশ্য ও দর্শন)

আধুনিক জীবনের ব্যস্ততার মাঝে দম্পতিরা যেন একে অপরের সাথে আধ্যাত্মিক এবং দ্বীনি মেলবন্ধন আরও মজবুত করতে পারেন, সেই স্বপ্ন নিয়ে **Our Whisper** অ্যাপটি তৈরি করা হয়েছে। 

- **আধ্যাত্মিক মেলবন্ধন (Spiritual Unity):** এটি কেবল একটি ব্যক্তিগত ট্র্যাকার নয়; বরং এটি স্বামী-স্ত্রীকে একযোগে দ্বীনি অভ্যাসের খোঁজ রাখতে উৎসাহিত করে।
- **স্নেহ ও দয়া (Mawaddah & Rahmah):** কুরআন ও সুন্নাহর আলোকে সুখী দাম্পত্য গড়ে তোলার জন্য এক গভীর অনুপ্রেরণার উৎস।
- **সালাত ও কুরআন কনেকশন (Prayer & Quran Connection):** প্রতিদিন কুরআন তিলাওয়াত এবং দৈনিক সালাতকে অভ্যাসে পরিণত করার সুন্দর ও সাবলীল সুযোগ।

---

## ✨ Features (মূল ফিচারসমূহ)

### 1. 📿 Complete Deen Tracker (দ্বীনি ট্র্যাকার)
- **Farz & Voluntary Prayers (সালাত ট্র্যাকার):** Track all 5 daily Farz prayers, along with Tahajjud, Duha, and other voluntary sunnah salahs.
- **Prayer Progress Views:** Toggle between "Me" and "Partner" modes to encourage and support each other's prayers with peace and kindness.

### 2. 📖 Quran KHATAM Companion with Navigation Controls (কুরআন তিলাওয়াত ও খতম ট্র্যাকার)
- **Compact Verses Batching:** Presents Quranic verses in structured groups of **42 Ayahs** per session, encouraging consistent daily reading.
- **Multi-lingual Context:** Each verse is displayed with clean Arabic script, Bengali translation (বাংলা অনুবাদ), and Bengali phonetic pronunciation (বাংলা উচ্চারণ).
- **Comprehensive Fallbacks:** Built-in direct public API fallbacks to ensure uninterrupted reading experience even if servers or services are temporarily under high load.
- **Flexible Navigation Controls:**
  - **Prev / Next 42 Ayahs:** Allows navigating back and forth across Quranic surahs and verse counts to allow correction of accidental progression or to reread past verses easily.
  - **Reset to Start:** Option to reset the complete progress log back to Ayah 1 with an instant UI scroll synchronization to re-begin a fresh reading journey.

### 3. 💬 Ruh AI Companion: Deeply Spiritual AI Counselor (রুহ - এআই আত্মিক সহচর)
**Ruh (روح)** is your deeply spiritual, wise, and Islamically compassionate AI mentor. 
- **Language Support (বাংলা সাপোর্ট):** Ruh speaks fluent, deeply polite, and soulful Bengali (বাংলা) by default. She greets couples with respectful terms and offers high-quality advice grounded in Islamic morals.
- **Structured Verses & Poems:** When asked to write a poem, ghazal, or romantic spiritual advice, Ruh structures them in standard, heart-warming poetic stanzas with perfect line breaks (`\n`) for premium readability.
- **Full Hybrid Handlers:** Designed to load with dedicated fallbacks for static hosting environments (like Vercel) where server-side Express handlers might not be natively executing.

### 4. 💖 Emotional Guidance Finder (আবেগভিত্তিক নির্দেশনা)
- Simply select your current feeling (e.g., Loving, Restless, Seeking Peace, Tired) and receive a tailored Qur'anic verse selection, authentic Duas in Arabic with Bangla pronunciation and English translations, and a comforting spiritual reflection.

### 5. ✍️ Shared Digital Journal & Mood Detection (শেয়ার্ড কুপল জার্নাল)
- A quiet digital space for spouses to jot down and log daily lessons, reflections, and thoughts.
- Integrated offline/API hybrids to guess the underlying mood and suggest a beautiful relevant scripture verse.

---

## 🛠️ Environmental Settings & Prerequisites (যা যা প্রয়োজন)

To unlock the full features of Our Whisper, the following environment variables can be configured within your `.env` (or Vercel environment parameters):

### For AI and Backend Features (Server-Side)
- `GEMINI_API_KEY`: Your Google Gemini API Key. Used in the server for transliterating verses on the fly, finding emotional state analysis, and conversing with **Ruh AI**.

### For Persistent Real-time Synced Database State (Firebase)
The application utilizes Firestore for immediate cross-device sync between spouses:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

*(Examples of empty declarations can be verified inside `.env.example`)*

---

## 🚀 How to Run Locally (কিভাবে লোকালি রান করবেন)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run in Development Mode:**
   ```bash
   npm run dev
   ```
   *This starts the unified Express runtime that hot-reloads your frontend UI assets at `http://localhost:3000` while proxying your Node api pathways correctly.*

3. **Production Compilation:**
   ```bash
   npm run build
   ```
   *This bundles both the server scripts into clean CJS formats inside `dist/server.cjs` and compiles the React SPA optimized bundles.*

4. **Production Server Startup:**
   ```bash
   npm start
   ```

---

## ☁️ Running On Serverless Environments (like Vercel)

The codebase has been natively integrated with a Vercel routing blueprint to support smooth deployments on Vercel without breaking API endpoints:

- **Server Entrypoint Mapping:** Registered at `/api/index.ts` connecting cleanly with Express core routing rules.
- **Rewrite Blueprints (`vercel.json`):**
  Auto-redirects all dynamic internal `/api/*` fetch routes directly to the API endpoints to ensure seamless operation regardless of where it's hosted.
- **Frontend Fallbacks:** Built-in client-side public API fail-safes are integrated inside components so that even if serverless configurations are entirely absent on direct client deployments, users can still fetch core Quran verses, translate meanings, and navigate their journeys seamlessly.

---

## 🛡️ Firestore Guard Rules (`firestore.rules`)
To keep couples' privacy secure and ensure only verified members of a couple can fetch/update their progress, make sure your Firestore security rules are applied properly:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper rules to check member affiliation
    function isMemberOf(uid, coupleId) {
      return request.auth != null && (uid in coupleId.split('_'));
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /couples/{coupleId} {
      allow read, write: if isMemberOf(request.auth.uid, coupleId);
      
      match /moods/{moodId} {
        allow read, write: if isMemberOf(request.auth.uid, coupleId);
      }

      match /favorites/{favoriteId} {
        allow read, write: if isMemberOf(request.auth.uid, coupleId);
      }
    }
  }
}
```

---

May this application bring abundant peace, guidance, and spiritual light (*Noor*) into you and your partner's lives. 🤲✨
