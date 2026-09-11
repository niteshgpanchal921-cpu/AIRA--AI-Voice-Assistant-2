import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Send, 
  Trash2, 
  Settings, 
  Key, 
  Check, 
  User, 
  ShieldCheck,
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { getAiraResponseStream, getAiraAudio, resetAiraSession } from "./services/geminiService";
import { processCommand, parseAIRACommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import { 
  AIRASettings, 
  loadAIRASettings, 
  saveAIRASettings, 
  parseLanguageName 
} from "./services/preferenceService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import AccountModal from "./components/AccountModal";
import ActionConfirmModal, { PendingAction } from "./components/ActionConfirmModal";
import { playPCM, playAiraVoice } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToAuth } from "./firebase/authService";
import { syncUserProfile, getUserMemories } from "./firebase/dbService";
import { UserProfile, UserMemory } from "./types/user";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "aira";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("aira_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("aira_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("aira_gemini_api_key") || "");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // User & Memory State (Firebase Auth & Firestore)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<UserMemory[]>([]);

  // AIRA Settings (Language, Wake Word, Calls, Messages, Alerts & Permissions)
  const [airaSettings, setAiraSettings] = useState<AIRASettings>(() => loadAIRASettings());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSettingsUpdate = useCallback((updated: AIRASettings) => {
    setAiraSettings(updated);
    saveAIRASettings(updated);
    if (liveSessionRef.current) {
      liveSessionRef.current.setWakeWordEnabled(updated.wakeWordEnabled, updated.wakeWordPhrase);
      liveSessionRef.current.setLanguage(parseLanguageName(updated.language));
    }
  }, []);

  const announceAlert = useCallback(async (type: "call" | "message", contact: string, messagePreview?: string) => {
    if (type === "call" && !airaSettings.callAlertsEnabled) return;
    if (type === "message" && !airaSettings.messageAlertsEnabled) return;

    const phrase = type === "call"
      ? `Incoming call from ${contact}`
      : `You have a new message from ${contact}`;

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "aira", text: phrase }]);

    if (!isMuted && airaSettings.voiceAssistantEnabled) {
      setAppState("speaking");
      const audioBase64 = await getAiraAudio(phrase);
      await playAiraVoice(phrase, audioBase64, airaSettings.language);
    }

    setPendingAction({
      id: Date.now().toString(),
      type: type === "call" ? "call_alert" : "message_alert",
      title: type === "call" ? `Incoming Call: ${contact}` : `New Message: ${contact}`,
      description: phrase,
      details: { contact, messageText: messagePreview },
      confirmLabel: type === "call" ? "Answer" : "Reply",
      cancelLabel: type === "call" ? "Reject" : "Dismiss",
      onConfirm: () => {
        if (type === "call") {
          setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "aira", text: `Connecting call with ${contact}...` }]);
        } else {
          setShowTextInput(true);
        }
        setPendingAction(null);
      },
      onCancel: () => {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "aira", text: type === "call" ? `Call from ${contact} rejected.` : `Message dismissed.` }]);
        setPendingAction(null);
      },
    });
  }, [airaSettings, isMuted]);

  const handleSimulateCallAlert = useCallback(() => {
    announceAlert("call", "Rahul");
  }, [announceAlert]);

  const handleSimulateMessageAlert = useCallback(() => {
    announceAlert("message", "Rahul", "Hey! Are you free for the project meeting?");
  }, [announceAlert]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            providerData: firebaseUser.providerData,
          });
          setCurrentUser(profile);
          if (profile.language) {
            setAiraSettings((prev) => ({
              ...prev,
              language: profile.language || prev.language,
              autoDetectLanguage: profile.autoDetectLanguage ?? prev.autoDetectLanguage,
            }));
          }
          if (profile.memoryEnabled) {
            const loadedMems = await getUserMemories(profile.uid);
            setMemories(loadedMems);
          }
        } catch (err) {
          console.error("Failed to sync profile:", err);
        }
      } else {
        setCurrentUser(null);
        setMemories([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState(isSessionActive ? "listening" : "idle");
      return;
    }

    if (liveSessionRef.current) {
      liveSessionRef.current.pauseListening();
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    setAppState("processing");

    // 1. Process AIRA Multilingual Add-on commands (Calls, Messages, App Access, Settings, Wake Word)
    const cmd = parseAIRACommand(finalTranscript, airaSettings);

    if (cmd.isHandled) {
      if (cmd.type === "settings" && cmd.data) {
        const updated = { ...airaSettings, ...cmd.data };
        handleSettingsUpdate(updated);
      }

      const responseText = cmd.spokenResponse || cmd.actionText || "";
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-a", sender: "aira", text: responseText }]);

      if (!isMuted && airaSettings.voiceAssistantEnabled) {
        setAppState("speaking");
        const audioBase64 = await getAiraAudio(responseText);
        await playAiraVoice(responseText, audioBase64, airaSettings.language);
      }

      if (cmd.requiresConfirmation && cmd.permissionGranted) {
        setPendingAction({
          id: Date.now().toString(),
          type: cmd.type as any,
          title: cmd.uiPrompt || "Confirmation Required",
          description: responseText,
          details: cmd.data,
          confirmLabel: cmd.type === "call" ? "Call" : cmd.type === "message" ? "Send" : "Allow",
          cancelLabel: "Cancel",
          onConfirm: () => {
            if (cmd.type === "call") {
              const num = cmd.data?.contact || "";
              if (/^\+?[0-9\s-]+$/.test(num)) {
                window.open(`tel:${num}`, "_self");
              }
            } else if (cmd.type === "message") {
              const msg = encodeURIComponent(cmd.data?.message || "");
              window.open(`sms:?body=${msg}`, "_blank");
            } else if ((cmd.type === "open_app" || cmd.type === "app" || cmd.type === "media_youtube" || cmd.type === "media_spotify") && (cmd.url || cmd.appUrl)) {
              window.open(cmd.url || cmd.appUrl, "_blank");
            }
            setPendingAction(null);
          },
          onCancel: () => {
            setPendingAction(null);
          },
        });
      } else if (!cmd.requiresConfirmation && (cmd.url || cmd.appUrl)) {
        setTimeout(() => {
          window.open(cmd.url || cmd.appUrl, "_blank");
        }, 800);
      }

      if (isSessionActive && liveSessionRef.current) {
        liveSessionRef.current.resumeListening();
      } else {
        setAppState("idle");
      }
      return;
    }

    // 2. High-speed streaming response with user personalization & language context
    const responseId = Date.now().toString() + "-a";
    setMessages((prev) => [...prev, { id: responseId, sender: "aira", text: "..." }]);

    const userContext = currentUser ? {
      name: currentUser.name,
      goals: currentUser.goals,
      preferences: currentUser.preferences,
      memories: currentUser.memoryEnabled ? memories.map((m) => `${m.title}: ${m.content}`) : [],
      language: airaSettings.language,
      autoDetectLanguage: airaSettings.autoDetectLanguage,
    } : {
      language: airaSettings.language,
      autoDetectLanguage: airaSettings.autoDetectLanguage,
    };

    const responseText = await getAiraResponseStream(
      finalTranscript,
      messagesRef.current,
      (_chunk, fullText) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === responseId ? { ...msg, text: fullText } : msg))
        );
      },
      userContext
    );

    if (!isMuted && responseText && airaSettings.voiceAssistantEnabled) {
      setAppState("speaking");
      const audioBase64 = await getAiraAudio(responseText);
      await playAiraVoice(responseText, audioBase64, airaSettings.language);
    }

    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.resumeListening();
    } else {
      setAppState("idle");
    }
  }, [isMuted, isSessionActive, currentUser, memories, airaSettings, handleSettingsUpdate]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetAiraSession();
    } else {
      try {
        setIsSessionActive(true);
        resetAiraSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        session.setWakeWordEnabled(airaSettings.wakeWordEnabled, airaSettings.wakeWordPhrase);
        session.setLanguage(parseLanguageName(airaSettings.language));
        session.onStateChange = (state) => {
          setAppState(state);
        };
        session.onSpeechInput = (text) => {
          handleTextCommand(text);
        };
        liveSessionRef.current = session;
        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const [isReplaying, setIsReplaying] = useState(false);
  const latestAiraMsg = [...messages].reverse().find((m) => m.sender === "aira");

  const handleReplay = async () => {
    if (!latestAiraMsg?.text || isReplaying) return;
    try {
      setIsReplaying(true);
      setAppState("speaking");
      const audioBase64 = await getAiraAudio(latestAiraMsg.text);
      await playAiraVoice(latestAiraMsg.text, audioBase64, airaSettings.language);
    } catch (e) {
      console.error("Replay failed:", e);
    } finally {
      setIsReplaying(false);
      setAppState(isSessionActive ? "listening" : "idle");
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#050505] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0">
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-6 py-4 md:px-12 md:py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center font-bold text-sm">
            A
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-wide opacity-90 leading-tight">AIRA</h1>
            <p className="text-[10px] text-white/50 tracking-wider">Built by NITESH.G.PANCHAL</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear the chat history?")) {
                  setMessages([]);
                  resetAiraSession();
                }
              }}
              className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10"
              title="Clear Chat History"
            >
              <Trash2 size={18} className="opacity-70" />
            </button>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={18} className="opacity-70" />
            ) : (
              <Volume2 size={18} className="opacity-70" />
            )}
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title="API Key Settings"
          >
            <Settings size={18} className="opacity-70" />
          </button>

          {/* Account Button */}
          <button
            onClick={() => setShowAccountModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              currentUser
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title={currentUser ? `Account: ${currentUser.name}` : "Account & Login"}
          >
            <User size={16} />
            <span className="text-xs font-medium max-w-[85px] truncate">
              {currentUser ? currentUser.name : "Account"}
            </span>
          </button>
        </div>
      </header>

      {/* API Key Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Gemini API Key Settings</h3>
                <p className="text-xs text-white/50">Configure your custom Gemini API key</p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-4">
              Enter your Gemini API key below. It will be stored securely in your browser's local storage for AIRA voice and chat sessions.
            </p>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-white/60">API KEY</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-medium transition-all"
                  title="Open Google AI Studio to get your Gemini API key"
                >
                  <ExternalLink size={12} />
                  <span>Get Gemini API Key</span>
                </a>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (apiKeyInput.trim() === "") {
                    localStorage.removeItem("aira_gemini_api_key");
                  } else {
                    localStorage.setItem("aira_gemini_api_key", apiKeyInput.trim());
                  }
                  setApiKeySaved(true);
                  setTimeout(() => {
                    setApiKeySaved(false);
                    setShowSettingsModal(false);
                  }, 1000);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {apiKeySaved ? (
                  <>
                    <Check size={16} /> Saved!
                  </>
                ) : (
                  "Save Key"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          currentUser={currentUser}
          memories={memories}
          airaSettings={airaSettings}
          onSettingsUpdate={handleSettingsUpdate}
          onClose={() => setShowAccountModal(false)}
          onUserUpdate={(profile) => setCurrentUser(profile)}
          onMemoriesUpdate={(updatedMemories) => setMemories(updatedMemories)}
          onTestCallAlert={handleSimulateCallAlert}
          onTestMessageAlert={handleSimulateMessageAlert}
        />
      )}

      {/* Action Confirmation Modal for Sensitive Actions & Alerts */}
      <ActionConfirmModal
        action={pendingAction}
        onClose={() => setPendingAction(null)}
      />

      {/* Main Content - Visualizer & Pure Transparent AI Words (No user words, transparent typography) */}
      <main className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none">
        {/* Center Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} />
        </div>

        {/* Status Indicator */}
        <div className="absolute bottom-28 md:bottom-32 left-0 right-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none">
          <div className="min-h-7 flex items-center justify-center mb-2">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-cyan-300/80 text-xs md:text-sm italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <Loader2 size={15} className="animate-spin text-cyan-400" />
                  <span>AIRA is thinking...</span>
                </motion.div>
              )}
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-violet-300/80 text-xs md:text-sm italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span>Listening...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-20 shrink-0 gap-4">
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 backdrop-blur-md shadow-2xl"
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message to AIRA..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="p-2 rounded-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:hover:bg-violet-500 transition-colors"
              >
                <Send size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span>Start Session</span>
              </>
            )}
          </button>
          
          {/* Replay Button */}
          {latestAiraMsg && latestAiraMsg.text && (
            <button
              id="footer-replay-btn"
              onClick={handleReplay}
              disabled={isReplaying}
              className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 transition-all duration-200 shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-40"
              title="Replay AIRA's spoken words"
            >
              <RotateCcw size={20} className={isReplaying ? "animate-spin text-pink-400" : ""} />
            </button>
          )}

          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl"
              title="Type instead"
            >
              <Keyboard size={20} className="opacity-70" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
