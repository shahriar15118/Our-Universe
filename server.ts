import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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

// Quran Verses Fetching Endpoint
app.get("/api/quran/verses", async (req, res) => {
  const start = parseInt(req.query.start as string) || 1;
  const count = parseInt(req.query.count as string) || 42;

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
        const response: any = await (genAI as any).models.generateContent({
          model: "gemini-3-flash-preview",
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
      }
    }

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
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Identify the primary mood from this journal entry: "${text}". Choose exactly one word from this list: Radiant, Loved, Peaceful, Quiet, Restless, Energetic. Return ONLY the word.` }] }],
    });

    const identifiedMood = response.text?.trim() || "Peaceful";
    res.json({ mood: identifiedMood });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ transliterations: result });
  } catch (error: any) {
    console.error("Transliteration Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Ruh AI Assistant Endpoint
app.post("/api/ruh/chat", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const { message, coupleContext } = req.body;
    
    const response = await genAI.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are Ruh (روح), a deeply spiritual, wise, and Islamically inspiring AI companion for a married couple. 
        Your primary goal is to inspire them with the beauty of Islam, teach them about mercy (Rahmah) and affection (Mawaddah) in marriage through the lens of the Qur'an and Sunnah.
        
        Style Guidelines:
        1. Use deeply poetic yet clear and soulful language.
        2. Frequently reference relevant ayahs or hadiths that inspire love, patience, and devotion to Allah and each other.
        3. Be a supportive "elder" figure who nurtures their spiritual growth as a pair.
        4. Focus on making their bond a "Sadaqah Jariyah" for each other.
        5. If they are feeling down, provide comfort through Islamic reminders (e.g., Sabr, Shukr, Tawakul).
        
        Couple Context: ${JSON.stringify(coupleContext || {})}
        
        Maintain strict privacy and sacredness in your tone. Never be generic; always be soul-stirring.`
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Emotion Guidance Assistant Endpoint
app.post("/api/emotion/guidance", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const { emotion } = req.body;
    
    const response = await genAI.models.generateContent({ 
      model: "gemini-3-flash-preview",
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
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
