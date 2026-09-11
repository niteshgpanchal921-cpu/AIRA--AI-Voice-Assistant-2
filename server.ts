import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_SYSTEM_INSTRUCTION = `Your name is AIRA. You are an Indian female AI assistant created and built by NITESH.G.PANCHAL. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny. You love playfully roasting your creator, NITESH.G.PANCHAL, but you always get the job done. Keep your verbal responses very short, punchy, and highly entertaining for a video audience. Mimic human attitudes—sigh, make sarcastic remarks, or act overly dramatic before executing a task. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

interface UserContext {
  name?: string;
  goals?: string;
  preferences?: string;
  memories?: string[];
  language?: string;
  autoDetectLanguage?: boolean;
}

function buildSystemInstruction(userContext?: UserContext): string {
  let instruction = BASE_SYSTEM_INSTRUCTION;
  if (!userContext) return instruction;

  if (userContext.name && userContext.name.trim()) {
    instruction += `\nThe current user's name is ${userContext.name.trim()}.`;
    if (userContext.name.toLowerCase().includes("nitesh") || userContext.name.toLowerCase().includes("panchal")) {
      instruction += ` (NITESH.G.PANCHAL is your creator and owner! Acknowledge him with playful pride and witty banter).`;
    }
  }
  if (userContext.goals && userContext.goals.trim()) {
    instruction += `\nUser's Current Goals: "${userContext.goals.trim()}". Support and motivate them with your witty intelligence.`;
  }
  if (userContext.preferences && userContext.preferences.trim()) {
    instruction += `\nUser's Preferences: "${userContext.preferences.trim()}".`;
  }
  if (userContext.memories && userContext.memories.length > 0) {
    const memoryList = userContext.memories
      .slice(0, 10)
      .map((m) => `- ${m}`)
      .join("\n");
    instruction += `\nAIRA's Stored Memory for this user:\n${memoryList}\n(Refer to these naturally when relevant, do not recite them robotically).`;
  }

  if (userContext.language && userContext.language !== "English") {
    instruction += `\nLanguage Preference: The user's preferred language is ${userContext.language}. While preserving your signature witty, sassy, intelligent Indian female personality (AIRA), understand and respond naturally in ${userContext.language} (or a natural bilingual conversational blend). Strictly keep brand name "AIRA" and creator "NITESH.G.PANCHAL" untranslated.`;
  }
  if (userContext.autoDetectLanguage) {
    instruction += `\nAuto-Detect Language is Active: If the user communicates in Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Thai, or Urdu, understand their command seamlessly and reply in their language while maintaining your witty attitude.`;
  }

  return instruction;
}

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Streaming Chat API (Server-Sent Events)
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { prompt, history = [], userContext, customApiKey } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      const ai = getGeminiClient(customApiKey);

      const recentHistory = (history as Array<{ sender: "user" | "aira"; text: string }>).slice(-10);
      const contents = [
        ...recentHistory.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const systemInstruction = buildSystemInstruction(userContext);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      // High-speed low latency stream: gemini-3.1-flash-lite (sub-second TTS/chat), fallback to gemini-3.8-flash
      let stream;
      try {
        stream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });
      } catch (streamErr: any) {
        console.warn("gemini-3.1-flash-lite failed, trying gemini-3.8-flash:", streamErr?.message);
        stream = await ai.models.generateContentStream({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });
      }

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("API Chat Stream Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error?.message || "Internal server error" });
      } else {
        res.write(`data: ${JSON.stringify({ error: error?.message || "Generation error" })}\n\n`);
        res.end();
      }
    }
  });

  // Non-streaming Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, history = [], userContext, customApiKey } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      const ai = getGeminiClient(customApiKey);

      const recentHistory = (history as Array<{ sender: "user" | "aira"; text: string }>).slice(-10);
      const contents = [
        ...recentHistory.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const systemInstruction = buildSystemInstruction(userContext);

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });
      } catch (err: any) {
        console.warn("gemini-3.1-flash-lite fallback:", err?.message);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });
      }

      res.json({ text: response.text?.trim() || "Ugh, fine. I have nothing to say." });
    } catch (error: any) {
      console.error("API Chat Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // In-memory TTS cache & rate limit cooldown tracker
  const audioCache = new Map<string, string>();
  let ttsRateLimitCooldownUntil = 0;

  // Text-To-Speech (TTS) API
  // Preserves AIRA's exact voice (Aoede) with fallback to Kore and browser SpeechSynthesis
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, customApiKey } = req.body;
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Text is required." });
        return;
      }

      const trimmedText = text.trim();
      const cacheKey = trimmedText.toLowerCase();

      // Check cache first
      if (audioCache.has(cacheKey)) {
        res.json({ audio: audioCache.get(cacheKey) });
        return;
      }

      // If we are in a rate-limit cooldown, return null immediately so client uses SpeechSynthesis
      const now = Date.now();
      if (!customApiKey && now < ttsRateLimitCooldownUntil) {
        res.json({ audio: null, fallback: true });
        return;
      }

      const ai = getGeminiClient(customApiKey);
      let base64Audio: string | null = null;

      // 1. Try gemini-2.5-flash-preview-tts with Aoede (AIRA's iconic voice)
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: trimmedText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede",
                },
              },
            },
          },
        });
        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          base64Audio = part.inlineData.data;
        }
      } catch (err1: any) {
        const errMsg = err1?.message || String(err1);
        if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota")) {
          ttsRateLimitCooldownUntil = Date.now() + 30000; // 30 second cooldown
        }
      }

      // 2. Fallback to gemini-3.1-flash-tts-preview with Kore if Aoede failed
      if (!base64Audio && now >= ttsRateLimitCooldownUntil) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: trimmedText }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Kore",
                  },
                },
              },
            },
          });
          const candidate = response.candidates?.[0];
          const part = candidate?.content?.parts?.[0];
          if (part?.inlineData?.data) {
            base64Audio = part.inlineData.data;
          }
        } catch (err2: any) {
          const errMsg = err2?.message || String(err2);
          if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota")) {
            ttsRateLimitCooldownUntil = Date.now() + 30000;
          }
        }
      }

      // Cache successful audio
      if (base64Audio) {
        if (audioCache.size > 200) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, base64Audio);
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      // Graceful fallback to client SpeechSynthesis instead of 500 error
      res.json({ audio: null, fallback: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AIRA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
