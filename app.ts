import express from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

// Gemini AI Setup
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Helper for calling Gemini with robust fallback models in case of high demand (503 status/rate limited)
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  if (!genAI) throw new Error("Gemini API key not configured");
  
  // Place fastest and lowest latency models first ('gemini-3.1-flash-lite' and 'gemini-flash-latest' have minimal/no thinking latency)
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError = null;
  
  for (const model of modelsToTry) {
    try {
      console.log(`[AI] Attempting AI generation with model: ${model}`);
      
      const modelConfig = { ...(params.config || {}) };
      if (model.startsWith("gemini-3")) {
        // Set thinking level to MINIMAL to reduce reasoning latency and achieve instant responses
        modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }
      
      const response = await genAI.models.generateContent({
        ...params,
        config: modelConfig,
        model: model
      });
      return response;
    } catch (err: any) {
      console.warn(`[AI] Model ${model} failed, error details:`, err.message || err);
      lastError = err;
    }
  }
  
  throw lastError || new Error("All fallback models failed");
}

// Simple in-memory cache for Quran verses
const quranCache = new Map<string, any>();

// Quran Verses Fetching Endpoint
app.get("/api/quran/verses", async (req, res) => {
  const start = parseInt(req.query.start as string) || 1;
  const count = parseInt(req.query.count as string) || 42;
  const cacheKey = `${start}-${count}`;

  if (quranCache.has(cacheKey)) {
    return res.json({ ayahs: quranCache.get(cacheKey) });
  }

  try {
    // 1. Get info about the start ayah to find out which surah it belongs to
    const infoRes = await fetch(`https://api.alquran.cloud/v1/ayah/${start}`);
    const infoData: any = await infoRes.json();
    if (infoData.code !== 200) throw new Error(`Ayah ${start} info not found`);

    const startSurahNum = infoData.data.surah.number;
    const startAyahInSurah = infoData.data.numberInSurah;
    
    // 2. Fetch surahs in parallel up to 114
    // We fetch current and next surah to ensure we have enough ayahs
    const surahP1 = fetch(`https://api.alquran.cloud/v1/surah/${startSurahNum}/editions/quran-uthmani,bn.bengali`).then(r => r.json());
    const surahP2 = startSurahNum < 114 
      ? fetch(`https://api.alquran.cloud/v1/surah/${startSurahNum + 1}/editions/quran-uthmani,bn.bengali`).then(r => r.json())
      : Promise.resolve(null);
    
    const [s1, s2] = await Promise.all([surahP1, surahP2]);
    
    let combined: any[] = [];
    
    const processSurah = (surahData: any, isStart: boolean) => {
      if (!surahData || surahData.code !== 200) return;
      const arabicAyahs = surahData.data[0].ayahs;
      const banglaAyahs = surahData.data[1].ayahs;
      const currentStartIdx = isStart ? startAyahInSurah - 1 : 0;
      
      const neededCount = count - combined.length;
      if (neededCount <= 0) return;

      const fetched = arabicAyahs.slice(currentStartIdx, currentStartIdx + neededCount).map((av: any, i: number) => ({
        number: av.number,
        numInSurah: av.numberInSurah,
        surah: surahData.data[0].name,
        surahEn: surahData.data[0].englishName,
        text: av.text,
        translation: banglaAyahs[currentStartIdx + i].text
      }));
      combined = [...combined, ...fetched];
    };

    processSurah(s1, true);
    if (combined.length < count && s2) processSurah(s2, false);

    // 3. Transliterate using Gemini (Faster Prompt)
    if (genAI && combined.length > 0) {
      try {
        const textToTransliterate = combined.map((c, i) => `${i}|${c.text}`).join("\n");
        const response: any = await generateContentWithFallback({
          contents: [{ parts: [{ text: `Transliterate these Quranic verses into Bengali (Bangla Uccharon). 
            Format: JSON array of strings only. Length: ${combined.length}.
            
            Verses:
            ${textToTransliterate}` }] }],
          config: { responseMimeType: "application/json" }
        });

        const transliterations = JSON.parse(response.text || "[]");
        if (Array.isArray(transliterations)) {
          combined.forEach((c: any, i: number) => {
            if (transliterations[i]) {
               // Clean up potential "index|" prefix if model included it
               c.transliteration = transliterations[i].includes('|') ? transliterations[i].split('|')[1].trim() : transliterations[i];
            }
          });
        }
      } catch (geminiError) {
        console.error("Transliteration Error:", geminiError);
        // Fallback: Provide default arabic text lookup indicator
        combined.forEach((c: any) => {
          if (!c.transliteration) {
            c.transliteration = "আরবি তিলাওয়াত দেখুন";
          }
        });
      }
    }

    quranCache.set(cacheKey, combined);
    res.json({ ayahs: combined });
  } catch (error: any) {
    console.error("Quran Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Journal Emotion Category Endpoint
app.post("/api/journal/identify-mood", async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "Gemini API key not configured" });

  try {
    const { text } = req.body;
    const response = await generateContentWithFallback({
      contents: [{ parts: [{ text: `Identify the primary mood from this journal entry: "${text}". Choose exactly one word from this list: Radiant, Loved, Peaceful, Quiet, Restless, Energetic. Return ONLY the word.` }] }],
    });

    const identifiedMood = response.text?.trim() || "Peaceful";
    res.json({ mood: identifiedMood });
  } catch (error: any) {
    console.warn("Journal identify-mood failed, using fallback:", error);
    res.json({ mood: "Peaceful", fallback: true });
  }
});

// Quran Transliteration Endpoint
app.post("/api/quran/transliterate", async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "Gemini API key not configured" });

  try {
    const { ayahs } = req.body; // Array of { id, text }
    if (!ayahs || !Array.isArray(ayahs)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const prompt = `Transliterate the following ${ayahs.length} Arabic Quranic verses into Bengali script (Bangla Uccharon). 
    Provide the output as a JSON array of exactly ${ayahs.length} strings, in the exact same order as the input. 
    Do NOT include any other text or formatting, just the raw JSON array.
    
    Verses:
    ${ayahs.map((a: any, i: number) => `${i + 1}. ${a.text}`).join("\n")}`;

    const response = await generateContentWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ transliterations: result });
  } catch (error: any) {
    console.error("Transliteration Error:", error);
    const { ayahs } = req.body;
    const fallbackList = Array.isArray(ayahs) ? ayahs.map(() => "আরবি তিলাওয়াত দেখুন") : [];
    res.json({ transliterations: fallbackList, fallback: true });
  }
});

// Ruh AI Assistant Endpoint
app.post("/api/ruh/chat", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const { message, history, coupleContext } = req.body;
    
    // Transform history to contents format expected by Gemini API (roles must alternate, e.g. user, model)
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        // Skip default/welcome message so that history starts with the first actual user turn
        if (h.sender === "ruh" && h.text.startsWith("Assalamu Alaikum. I am Ruh")) {
          return;
        }
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    
    // Filter out any leading model messages before the first user message to guarantee strict starting on 'user'
    let startIndex = 0;
    while (startIndex < contents.length && contents[startIndex].role === "model") {
      startIndex++;
    }
    const finalContents = contents.slice(startIndex);
    
    // Append the current message
    finalContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback({ 
      contents: finalContents,
      config: {
        systemInstruction: `You are Ruh (روح), a deeply spiritual, wise, and Islamically inspiring AI companion for a married couple. 
        Your primary goal is to inspire them with the beauty of Islam, teach them about mercy (Rahmah) and affection (Mawaddah) in marriage through the lens of the Qur'an and Sunnah.
        
        Language Requirement:
        - Critical Language Rule: You MUST dynamically detect the language of the user's prompt (message) and respond in that EXACT SAME language.
        - If the user writes or prompts in English, you MUST respond entirely in beautiful, polite, and deeply soulful English.
        - If the user writes or prompts in Bengali (or Banglish/Roman Bengali script), you MUST respond entirely in polite, fluent, and deeply soulful Bengali (বাংলা).
        - Always mirror the user's chosen language perfectly. Do not respond in Bengali if they prompt in English, and vice versa.
        
        Style Guidelines:
        1. Use deeply poetic yet clear, warming, and soulful Bengali.
        2. Frequently reference relevant ayahs or hadiths that inspire love, patience, and devotion to Allah and each other.
        3. Be a supportive "elder" figure who nurtures their spiritual growth as a pair.
        4. Focus on making their bond a "Sadaqah Jariyah" for each other.
        5. If they are feeling down, provide comfort through Islamic reminders (e.g., Sabr, Shukr, Tawakul).
        6. CRITICAL: When writing poems, spiritual songs (Nashid/Ghazal), or romantic verses in Bengali, always format them with beautiful stanzas, proper spacing, and separate lines (using standard line breaks '\\n') so they read and look like gorgeous structured poetry rather than a single continuous flat paragraph or broken formatting.
        
        Couple Context: ${JSON.stringify(coupleContext || {})}
        
        Maintain strict privacy and sacredness in your tone. Never be generic; always be soul-stirring.`
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "The spiritual AI engine is experiencing a gentle wave of temporary high demand. Please repeat your message in a few moments, as indeed with hardship there is ease." });
  }
});

// Emotion Guidance Assistant Endpoint
app.post("/api/emotion/guidance", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const { emotion } = req.body;
    
    const response = await generateContentWithFallback({ 
      contents: [{ parts: [{ text: `Provide spiritual guidance from the Quran and Sunnah for someone feeling "${emotion}". 
      Return the response in a structured JSON format with the following fields:
      - ayah: The Arabic text of a relevant Quranic verse.
      - ref: The reference (Surah:Verse).
      - trans: An English translation of the verse.
      - tafsir: A short (2-3 sentence) spiritual reflection or explanation.
      - dua: An object containing:
          - arabic: The Arabic text of a relevant Dua.
          - trans: English translation of the Dua.
          - bangla: Bengali transliteration (Bangla Uccharon) of the Dua.` }] }],
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a compassionate Islamic counselor providing soul-stirring spiritual guidance."
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Elegant fallback during times of high load or 503 to maintain fully functional app
    res.json({
      ayah: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      ref: "94:6",
      trans: "Indeed, with hardship [will be] ease.",
      tafsir: "During busy spiritual moments when request lines are congested, this beautiful Quranic assurance reminds us that ease is forever near and divine tranquility resides in patience.",
      dua: {
        arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ_وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
        trans: "Our Lord, grant us from among our spouses and offspring comfort to our eyes and make us an example for the righteous.",
        bangla: "রব্বানা হাবলানা মিন আজওয়াজিনা ওয়া জুররিয়্যাতিনা কুররাতা আ’ইউনিন ওয়া জা’আলনা লিলমুত্তাক্বীনা ইমামা"
      }
    });
  }
});

export default app;
