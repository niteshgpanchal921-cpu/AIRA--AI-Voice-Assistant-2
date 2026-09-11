export class LiveSessionManager {
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private isRunning: boolean = false;
  public isMuted: boolean = false;
  private isPausedForSpeaking: boolean = false;

  public speechLang: string = "en-IN";
  public wakeWordEnabled: boolean = true;
  public wakeWordPhrase: string = "hey aira";

  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onSpeechInput: (text: string) => void = () => {};
  public onWakeWordDetected: () => void = () => {};
  public onPermissionDenied: () => void = () => {};

  async start() {
    try {
      this.isRunning = true;
      this.isPausedForSpeaking = false;
      this.onStateChange("processing");

      // 1. Verify mic access
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (micErr: any) {
        console.warn("Microphone access denied or unavailable:", micErr);
        this.onPermissionDenied();
        this.stop();
        throw micErr;
      }

      // 2. Initialize Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        this.onStateChange("idle");
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.speechLang || "en-IN";

      this.recognition.onstart = () => {
        if (this.isRunning && !this.isPausedForSpeaking) {
          this.onStateChange("listening");
        }
      };

      this.recognition.onresult = (event: any) => {
        if (!this.isRunning || this.isPausedForSpeaking) return;

        const results = event.results;
        const lastIndex = results.length - 1;
        if (lastIndex >= 0 && results[lastIndex].isFinal) {
          const rawTranscript = results[lastIndex][0].transcript.trim();
          if (!rawTranscript) return;

          const lowerTranscript = rawTranscript.toLowerCase();
          const targetPhrase = (this.wakeWordPhrase || "hey aira").toLowerCase().trim();

          // Check if wake word matches
          if (
            this.wakeWordEnabled &&
            (lowerTranscript.startsWith(targetPhrase) ||
              lowerTranscript.includes(targetPhrase) ||
              lowerTranscript === "aira" ||
              lowerTranscript.startsWith("aira"))
          ) {
            this.onWakeWordDetected();

            // Extract command text after wake word
            const afterWake = rawTranscript
              .replace(new RegExp(`^.*?(${targetPhrase}|aira)[,\\s]*`, "i"), "")
              .trim();

            if (afterWake) {
              this.onSpeechInput(afterWake);
            }
            return;
          }

          // Regular speech input
          this.onSpeechInput(rawTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === "no-speech") {
          // Normal timeout, ignore
          return;
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          this.onPermissionDenied();
          this.stop();
          return;
        }
        console.warn("Speech recognition error:", event.error);
      };

      this.recognition.onend = () => {
        // Auto-restart smoothly if session is running and not paused
        if (this.isRunning && !this.isPausedForSpeaking) {
          setTimeout(() => {
            if (this.isRunning && !this.isPausedForSpeaking && this.recognition) {
              try {
                this.recognition.start();
                this.onStateChange("listening");
              } catch {
                // If start throws InvalidStateError, it is already active
              }
            }
          }, 100);
        }
      };

      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Recognition initial start notice:", e);
      }
      this.onStateChange("listening");
    } catch (error) {
      console.error("Failed to start speech session:", error);
      this.stop();
      throw error;
    }
  }

  pauseListening() {
    this.isPausedForSpeaking = true;
    try {
      this.recognition?.stop();
    } catch {}
  }

  resumeListening() {
    this.isPausedForSpeaking = false;
    if (this.isRunning && this.recognition) {
      setTimeout(() => {
        if (this.isRunning && !this.isPausedForSpeaking && this.recognition) {
          try {
            this.recognition.start();
            this.onStateChange("listening");
          } catch (e: any) {
            if (e?.name === "InvalidStateError") {
              this.onStateChange("listening");
            }
          }
        }
      }, 120);
    }
  }

  setWakeWordEnabled(enabled: boolean, phrase?: string) {
    this.wakeWordEnabled = enabled;
    if (phrase) {
      this.wakeWordPhrase = phrase.toLowerCase().trim();
    }
  }

  setLanguage(langCode: string) {
    this.speechLang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  sendText(text: string) {
    if (text.trim()) {
      this.onSpeechInput(text.trim());
    }
  }

  stop() {
    this.isRunning = false;
    this.isPausedForSpeaking = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.onStateChange("idle");
  }
}
