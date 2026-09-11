export interface UserContext {
  name?: string;
  goals?: string;
  preferences?: string;
  memories?: string[];
  language?: string;
  autoDetectLanguage?: boolean;
}

function getCustomApiKey(): string | undefined {
  const customKey = localStorage.getItem("aira_gemini_api_key");
  return customKey && customKey.trim() !== "" ? customKey.trim() : undefined;
}

export function resetAiraSession() {
  // Session reset logic if required
}

/**
 * High-speed streaming response pipeline via server-side /api/chat/stream.
 * Emits progressive chunks as they arrive for instant, zero-wait UI feedback.
 */
export async function getAiraResponseStream(
  prompt: string,
  history: { sender: "user" | "aira"; text: string }[] = [],
  onChunk: (chunk: string, fullText: string) => void,
  userContext?: UserContext
): Promise<string> {
  try {
    const customApiKey = getCustomApiKey();

    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        history,
        userContext,
        customApiKey,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No readable stream received from server");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            console.warn("Stream returned error message:", parsed.error);
          } else if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text, fullText);
          }
        } catch {
          // Ignore JSON parse errors for incomplete chunks
        }
      }
    }

    // Process any trailing buffer
    if (buffer.trim().startsWith("data:")) {
      const dataStr = buffer.trim().replace(/^data:\s*/, "");
      if (dataStr !== "[DONE]") {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text, fullText);
          }
        } catch {}
      }
    }

    return fullText.trim() || "Ugh, fine. I have nothing to say.";
  } catch (error: any) {
    console.error("AIRA Stream Error:", error);
    const fallback = "Uff, mera dimaag kharab ho gaya hai. Network issue or API error. Try again!";
    onChunk(fallback, fallback);
    return fallback;
  }
}

/**
 * Standard non-streaming response via server-side /api/chat.
 */
export async function getAiraResponse(
  prompt: string,
  history: { sender: "user" | "aira"; text: string }[] = [],
  userContext?: UserContext
): Promise<string> {
  try {
    const customApiKey = getCustomApiKey();

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        history,
        userContext,
        customApiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text?.trim() || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("AIRA Chat Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Nitesh.G.";
  }
}

/**
 * Text-to-Speech audio pipeline via server-side /api/tts.
 * Preserves AIRA's iconic voice and playback format (24kHz PCM).
 */
export async function getAiraAudio(text: string): Promise<string | null> {
  try {
    const customApiKey = getCustomApiKey();

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        customApiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.audio || null;
  } catch (error) {
    console.error("AIRA TTS Error:", error);
    return null;
  }
}
