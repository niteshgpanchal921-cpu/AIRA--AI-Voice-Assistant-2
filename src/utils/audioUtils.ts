import { parseLanguageName } from "../services/preferenceService";

export async function playPCM(base64Data: string): Promise<void> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = new Int16Array(bytes.buffer);
    const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

    return new Promise<void>((resolve) => {
      source.onended = () => {
        try {
          audioCtx.close();
        } catch {}
        resolve();
      };
    });
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}

/**
 * Robust speech speaker that plays Gemini PCM audio if provided,
 * or gracefully falls back to browser SpeechSynthesis so AIRA never goes silent.
 */
export async function playAiraVoice(
  text: string,
  audioBase64: string | null,
  languageName?: string
): Promise<void> {
  if (audioBase64) {
    try {
      await playPCM(audioBase64);
      return;
    } catch (e) {
      console.warn("PCM playback error, using synthesis fallback:", e);
    }
  }

  // Fallback to browser SpeechSynthesis if audioBase64 is null or failed
  if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
    return new Promise<void>((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const speechCode = parseLanguageName(languageName || "English");
        utterance.lang = speechCode || "en-IN";
        utterance.pitch = 1.05;
        utterance.rate = 1.02;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(
          (v) =>
            v.lang === speechCode ||
            v.lang.startsWith(speechCode.split("-")[0]) ||
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("india")
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }
}
