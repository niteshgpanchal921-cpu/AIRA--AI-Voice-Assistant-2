import React from "react";
import { 
  Languages, 
  Sliders, 
  Mic, 
  Bell, 
  Phone, 
  MessageSquare, 
  Radio, 
  ExternalLink, 
  Check, 
  Lock, 
  Sparkles,
  PhoneIncoming,
  MessageCircle
} from "lucide-react";
import { AIRASettings, SUPPORTED_LANGUAGES, requestBrowserNotificationPermission } from "../services/preferenceService";
import { UserProfile } from "../types/user";
import { updateUserProfile } from "../firebase/dbService";

interface LanguageTabProps {
  settings: AIRASettings;
  onSettingsUpdate: (settings: AIRASettings) => void;
  currentUser: UserProfile | null;
  onUserUpdate: (user: UserProfile | null) => void;
}

export function LanguageTab({
  settings,
  onSettingsUpdate,
  currentUser,
  onUserUpdate,
}: LanguageTabProps) {
  const handleSelectLanguage = async (langName: string) => {
    const updated: AIRASettings = { ...settings, language: langName };
    onSettingsUpdate(updated);

    if (currentUser) {
      try {
        await updateUserProfile(currentUser.uid, { language: langName });
        onUserUpdate({ ...currentUser, language: langName });
      } catch (err) {
        console.error("Failed to update language in Firestore:", err);
      }
    }
  };

  const handleToggleAutoDetect = async () => {
    const nextVal = !settings.autoDetectLanguage;
    const updated: AIRASettings = { ...settings, autoDetectLanguage: nextVal };
    onSettingsUpdate(updated);

    if (currentUser) {
      try {
        await updateUserProfile(currentUser.uid, { autoDetectLanguage: nextVal });
        onUserUpdate({ ...currentUser, autoDetectLanguage: nextVal });
      } catch (err) {
        console.error("Failed to update autoDetectLanguage in Firestore:", err);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-cyan-400" />
              Interface & AI Response Language
            </h4>
            <p className="text-xs text-white/60">
              AIRA understands and responds in your selected language while preserving her witty Indian personality.
            </p>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = settings.language === lang.name;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleSelectLanguage(lang.name)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-white"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 text-white/70 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">{lang.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <span className="text-[11px] text-white/40 mt-1 font-sans">{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto Detect Language Toggle */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-white block">AUTO DETECT LANGUAGE</span>
          <p className="text-[11px] text-white/50">
            Automatically detect and understand commands spoken or typed in Hindi, Kannada, Telugu, etc.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleAutoDetect}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            settings.autoDetectLanguage
              ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              : "bg-white/10 text-white/60 border border-white/10"
          }`}
        >
          {settings.autoDetectLanguage ? "ON" : "OFF"}
        </button>
      </div>

      {/* Locked Voice Notice */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-200/80">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Voice Lock Active:</strong> AIRA's existing custom voice model (Aoede) is locked and preserved. Brand name <strong>AIRA – AI Voice Assistant</strong> and <strong>Built by Nitesh.G</strong> remain unchanged across all languages.
        </p>
      </div>
    </div>
  );
}

interface PermissionsTabProps {
  settings: AIRASettings;
  onSettingsUpdate: (settings: AIRASettings) => void;
  currentUser: UserProfile | null;
  onTestCallAlert?: () => void;
  onTestMessageAlert?: () => void;
}

export function PermissionsTab({
  settings,
  onSettingsUpdate,
  currentUser,
  onTestCallAlert,
  onTestMessageAlert,
}: PermissionsTabProps) {
  const handleToggle = (key: keyof AIRASettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    onSettingsUpdate(updated);
    if (currentUser) {
      updateUserProfile(currentUser.uid, { [key]: updated[key] }).catch(console.error);
    }
  };

  const handleWakePhraseChange = (phrase: string) => {
    const updated = { ...settings, wakeWordPhrase: phrase };
    onSettingsUpdate(updated);
    if (currentUser) {
      updateUserProfile(currentUser.uid, { wakeWordPhrase: phrase }).catch(console.error);
    }
  };

  const handlePermissionToggle = async (key: keyof AIRASettings["permissions"]) => {
    const currentStatus = settings.permissions[key];

    if (key === "notifications" && currentStatus !== "granted") {
      const granted = await requestBrowserNotificationPermission();
      const nextStatus = granted ? "granted" : "denied";
      const updated: AIRASettings = {
        ...settings,
        permissions: { ...settings.permissions, notifications: nextStatus },
      };
      onSettingsUpdate(updated);
      return;
    }

    const nextStatus = currentStatus === "granted" ? "denied" : "granted";
    const updated: AIRASettings = {
      ...settings,
      permissions: { ...settings.permissions, [key]: nextStatus },
    };
    onSettingsUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER VOICE CONTROL */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Master Voice Controls
        </h4>

        <div className="space-y-2">
          {/* VOICE ASSISTANT [ON/OFF] */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">VOICE ASSISTANT</span>
              <span className="text-[11px] text-white/50">Master switch for assistant speech and input</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("voiceAssistantEnabled")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                settings.voiceAssistantEnabled
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {settings.voiceAssistantEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* WAKE WORD [ON/OFF] */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">WAKE WORD</span>
                <span className="text-[11px] text-white/50">
                  Activates voice listening hands-free on saying "{settings.wakeWordPhrase || "Hey AIRA"}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("wakeWordEnabled")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  settings.wakeWordEnabled
                    ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {settings.wakeWordEnabled ? "ON" : "OFF"}
              </button>
            </div>
            {settings.wakeWordEnabled && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-white/60">Wake Phrase:</span>
                <input
                  type="text"
                  value={settings.wakeWordPhrase}
                  onChange={(e) => handleWakePhraseChange(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-cyan-200 outline-none focus:border-cyan-400 w-32"
                  placeholder="Hey AIRA"
                />
                <span className="text-[10px] text-white/40 italic">Processed on-device locally</span>
              </div>
            )}
          </div>

          {/* ACTION CONTROL [ON/OFF] */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">ACTION CONTROL</span>
              <span className="text-[11px] text-white/50">
                When ON: Supported device and app actions may execute. When OFF: Normal conversation mode only.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("actionControlEnabled")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                settings.actionControlEnabled
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {settings.actionControlEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* CALL ALERTS [ON/OFF] */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">CALL ALERTS</span>
              <span className="text-[11px] text-white/50">Announce incoming call alerts (e.g. "Incoming call from Rahul")</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("callAlertsEnabled")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                settings.callAlertsEnabled
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {settings.callAlertsEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* MESSAGE ALERTS [ON/OFF] */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">MESSAGE ALERTS</span>
              <span className="text-[11px] text-white/50">Announce incoming message notifications</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("messageAlertsEnabled")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                settings.messageAlertsEnabled
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {settings.messageAlertsEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEVICE & CAPABILITY PERMISSIONS */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" />
          AIRA Permissions
        </h4>

        <div className="space-y-2">
          {[
            { key: "microphone" as const, label: "Microphone", desc: "Voice command recognition and speech input" },
            { key: "notifications" as const, label: "Notifications", desc: "System alerts for calls & messages" },
            { key: "calls" as const, label: "Calls", desc: "Interact with phone/call features where supported" },
            { key: "messages" as const, label: "Messages", desc: "Interact with messaging apps and send replies" },
            { key: "appAccess" as const, label: "App Access", desc: "Permission to open YouTube, WhatsApp, and tools" },
          ].map((item) => {
            const status = settings.permissions[item.key] || "prompt";
            const isGranted = status === "granted";
            return (
              <div key={item.key} className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{item.label}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isGranted
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-white/50"
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50">{item.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePermissionToggle(item.key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isGranted
                      ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {isGranted ? "ON" : "OFF"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SIMULATE & TEST ALERTS */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400">Test Alert Announcements</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onTestCallAlert}
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
          >
            <PhoneIncoming size={14} />
            Simulate Call Alert
          </button>
          <button
            type="button"
            onClick={onTestMessageAlert}
            className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle size={14} />
            Simulate Message Alert
          </button>
        </div>
      </div>
    </div>
  );
}
