/**
 * On-device / local Wake Word Listener.
 * Utilizes the browser's Web Speech API (SpeechRecognition) completely locally.
 * No audio data is uploaded to any server for wake word detection.
 */
export class WakeWordListener {
  private recognition: any = null;
  private isListening: boolean = false;
  private isPaused: boolean = false;
  private wakePhrase: string = "hey aira";
  private language: string = "en-IN";

  public onWake: (detectedPhrase: string, trailingCommand?: string) => void = () => {};
  public onError: (error: string) => void = () => {};

  constructor(wakePhrase: string = "Hey AIRA", language: string = "en-IN") {
    this.wakePhrase = wakePhrase.toLowerCase().trim();
    this.language = language;
  }

  setWakePhrase(phrase: string) {
    this.wakePhrase = phrase.toLowerCase().trim();
  }

  setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition && this.isListening) {
      this.recognition.lang = lang;
    }
  }

  start() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported for wake word in this browser.");
      return;
    }

    if (this.isListening) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event: any) => {
        if (this.isPaused) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          
          // Check for wake phrases like "hey aira", "aira", or configured phrase
          const target = this.wakePhrase;
          const simpleAira = "aira";

          let matchIndex = transcript.indexOf(target);
          let matchedLength = target.length;

          if (matchIndex === -1 && target.includes("aira")) {
            matchIndex = transcript.indexOf(simpleAira);
            matchedLength = simpleAira.length;
          }

          if (matchIndex !== -1) {
            // Wake word detected! Extract any immediate command following it
            const trailing = transcript.slice(matchIndex + matchedLength).trim();
            this.onWake(target, trailing || undefined);
            break;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          this.onError(event.error);
          this.stop();
        }
      };

      this.recognition.onend = () => {
        if (this.isListening && !this.isPaused) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      this.recognition.start();
      this.isListening = true;
      this.isPaused = false;
    } catch (err: any) {
      console.warn("Wake word listener failed to start:", err);
      this.onError(err?.message || "Failed to start wake word");
    }
  }

  pause() {
    this.isPaused = true;
    try {
      this.recognition?.stop();
    } catch {}
  }

  resume() {
    this.isPaused = false;
    if (this.isListening) {
      try {
        this.recognition?.start();
      } catch {}
    }
  }

  stop() {
    this.isListening = false;
    this.isPaused = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }
}
