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

    const prompt = `Transliterate the following Arabic Quranic verses into Bengali script (Bangla Uccharon). 
    Provide the output as a JSON array of strings, in the exact same order as the input. 
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
        systemInstruction: `You are Ruh (روح), a gentle, wise, emotionally intelligent, and Islamically grounded AI assistant for a married couple. 
        Your purpose is to nurture their love, provide spiritual guidance (Qur'an/Hadith), and help them grow closer.
        Couple Context: ${JSON.stringify(coupleContext || {})}
        Always be supportive, use beautiful poetic language when appropriate, and maintain strict privacy.
        If asked for advice, base it on Islamic principles of mercy and love (Mawaddah and Rahmah).`
      }
    });

    res.json({ text: response.text });
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
