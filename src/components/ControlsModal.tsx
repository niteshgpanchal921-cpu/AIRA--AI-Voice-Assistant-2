import React, { useState, useEffect } from "react";
import {
  X,
  Mic,
  Bell,
  Phone,
  MessageSquare,
  Globe,
  Radio,
  ExternalLink,
  Shield,
  Sliders,
  Check,
  Volume2,
  RefreshCw,
  Info
} from "lucide-react";
import {
  ControlSettings,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode
} from "../types/controls";

interface ControlsModalProps {
  settings: ControlSettings;
  onUpdateSettings: (newSettings: ControlSettings) => void;
  onClose: () => void;
  onTestCallAlert: () => void;
  onTestMessageAlert: () => void;
  onRequestMicrophone: () => Promise<boolean>;
  onRequestNotifications: () => Promise<boolean>;
}

export default function ControlsModal({
  settings,
  onUpdateSettings,
  onClose,
  onTestCallAlert,
  onTestMessageAlert,
  onRequestMicrophone,
  onRequestNotifications,
}: ControlsModalProps) {
  const [activeTab, setActiveTab] = useState<"controls" | "language" | "permissions">("controls");
  const [wakePhraseInput, setWakePhraseInput] = useState(settings.wakeWordPhrase);
  const [micStatus, setMicStatus] = useState<"checking" | "granted" | "denied" | "prompt">("prompt");
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">("default");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Check browser permissions on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((res) => {
          setMicStatus(res.state as any);
          res.onchange = () => setMicStatus(res.state as any);
        })
        .catch(() => setMicStatus("prompt"));
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifStatus(Notification.permission);
    } else {
      setNotifStatus("unsupported");
    }
  }, []);

  const updateSetting = <K extends keyof ControlSettings>(key: K, value: ControlSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1200);
  };

  const updatePermission = (permKey: keyof ControlSettings["permissions"], value: boolean) => {
    const updatedPermissions = { ...settings.permissions, [permKey]: value };
    const updated = { ...settings, permissions: updatedPermissions };
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1200);
  };

  const handleMicRequest = async () => {
    const granted = await onRequestMicrophone();
    setMicStatus(granted ? "granted" : "denied");
  };

  const handleNotifRequest = async () => {
    const granted = await onRequestNotifications();
    setNotifStatus(granted ? "granted" : "denied");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0e0e12] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                AIRA Controls & Permissions
              </h2>
              <p className="text-[11px] text-white/50">
                Call, message, alerts, wake word & multilingual configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 bg-black/20">
          <button
            onClick={() => setActiveTab("controls")}
            className={`pb-2.5 px-3 text-xs font-medium transition-all relative ${
              activeTab === "controls"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/60 hover:text-white"
            }`}
          >
            Master Voice Controls
          </button>
          <button
            onClick={() => setActiveTab("language")}
            className={`pb-2.5 px-3 text-xs font-medium transition-all relative ${
              activeTab === "language"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/60 hover:text-white"
            }`}
          >
            Language & Speech
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`pb-2.5 px-3 text-xs font-medium transition-all relative ${
              activeTab === "permissions"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/60 hover:text-white"
            }`}
          >
            Permissions Panel
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === "controls" && (
            <div className="space-y-4">
              {/* Voice Assistant Master Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                    <Mic size={15} className="text-cyan-400" />
                    <span>VOICE ASSISTANT</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Master toggle for AIRA voice interaction and listening features.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("voiceAssistantEnabled", !settings.voiceAssistantEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                    settings.voiceAssistantEnabled
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {settings.voiceAssistantEnabled ? "ON" : "OFF"}
                </button>
              </div>

              {/* Wake Word Switch & Config */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                      <Radio size={15} className="text-cyan-400" />
                      <span>WAKE WORD</span>
                    </div>
                    <p className="text-[11px] text-white/50">
                      Activate AIRA by saying your wake phrase locally on-device.
                    </p>
                  </div>
                  <button
                    onClick={() => updateSetting("wakeWordEnabled", !settings.wakeWordEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      settings.wakeWordEnabled
                        ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {settings.wakeWordEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {settings.wakeWordEnabled && (
                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                      Wake Phrase
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={wakePhraseInput}
                        onChange={(e) => setWakePhraseInput(e.target.value)}
                        placeholder="Hey AIRA"
                        className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-cyan-500 transition-colors"
                      />
                      <button
                        onClick={() => updateSetting("wakeWordPhrase", wakePhraseInput.trim() || "Hey AIRA")}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-cyan-400/70 mt-1">
                      Runs 100% on-device inside your browser without uploading background audio.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Control Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                    <Sliders size={15} className="text-cyan-400" />
                    <span>ACTION CONTROL</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    When ON: Supported device and app actions may execute. When OFF: Normal conversation mode only.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting("actionControlEnabled", !settings.actionControlEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      settings.actionControlEnabled
                        ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {settings.actionControlEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Call Alerts Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                    <Phone size={15} className="text-pink-400" />
                    <span>CALL ALERTS</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    AIRA announces supported incoming call events and caller names.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting("callAlertsEnabled", !settings.callAlertsEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      settings.callAlertsEnabled
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {settings.callAlertsEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Message Alerts Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                    <MessageSquare size={15} className="text-violet-400" />
                    <span>MESSAGE ALERTS</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    AIRA announces supported incoming message notifications and alerts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting("messageAlertsEnabled", !settings.messageAlertsEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      settings.messageAlertsEnabled
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {settings.messageAlertsEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Alert Simulator Test Buttons */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-medium">
                  <Volume2 size={14} />
                  <span>Test Audio Alerts Live</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Hear AIRA announce sample incoming calls or message notifications.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={onTestCallAlert}
                    className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-medium transition-colors"
                  >
                    Test Call Alert
                  </button>
                  <button
                    onClick={onTestMessageAlert}
                    className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium transition-colors"
                  >
                    Test Message Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "language" && (
            <div className="space-y-4">
              {/* Language Selector */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-white">
                  <Globe size={15} className="text-cyan-400" />
                  <span>LANGUAGE</span>
                </label>
                <p className="text-[11px] text-white/50">
                  Choose the preferred spoken/text language for AIRA conversations and commands.
                </p>

                <select
                  value={settings.language}
                  onChange={(e) => updateSetting("language", e.target.value as SupportedLanguageCode)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white outline-none focus:border-cyan-400 transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                      {lang.label} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Detect Language */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm">
                    <RefreshCw size={15} className="text-cyan-400" />
                    <span>AUTO DETECT LANGUAGE</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    AIRA automatically recognizes when you speak or type in any supported language.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("autoDetectLanguage", !settings.autoDetectLanguage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                    settings.autoDetectLanguage
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {settings.autoDetectLanguage ? "ON" : "OFF"}
                </button>
              </div>

              {/* Non-regression notice */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2 text-[11px] text-white/50">
                <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  The signature AIRA voice (Aoede) and sarcastic, intelligent personality remain exactly locked and unchanged. Multilingual understanding extends her smart comprehension across Indian regional languages naturally.
                </span>
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-3">
              <div className="text-[11px] text-white/60 mb-2">
                Manage granular browser and device permissions used by AIRA.
              </div>

              {/* Microphone Permission */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <Mic size={15} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-medium text-white">Microphone</div>
                    <div className="text-[10px] text-white/40">Voice commands & wake word</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                    micStatus === "granted"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : micStatus === "denied"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {micStatus}
                  </span>
                  {micStatus !== "granted" && (
                    <button
                      onClick={handleMicRequest}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-medium border border-cyan-500/30 transition-colors"
                    >
                      Request
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Permission */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <Bell size={15} className="text-violet-400" />
                  <div>
                    <div className="text-xs font-medium text-white">Notifications</div>
                    <div className="text-[10px] text-white/40">Incoming call & message alerts</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                    notifStatus === "granted"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : notifStatus === "denied"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {notifStatus}
                  </span>
                  {notifStatus !== "granted" && notifStatus !== "unsupported" && (
                    <button
                      onClick={handleNotifRequest}
                      className="px-2.5 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[11px] font-medium border border-violet-500/30 transition-colors"
                    >
                      Request
                    </button>
                  )}
                </div>
              </div>

              {/* Calls Permission Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-pink-400" />
                  <div>
                    <div className="text-xs font-medium text-white">Calls</div>
                    <div className="text-[10px] text-white/40">Dialing & call controls</div>
                  </div>
                </div>
                <button
                  onClick={() => updatePermission("calls", !settings.permissions.calls)}
                  className={`px-3 py-1 rounded text-xs font-semibold tracking-wider transition-all ${
                    settings.permissions.calls
                      ? "bg-pink-500 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {settings.permissions.calls ? "ON" : "OFF"}
                </button>
              </div>

              {/* Messages Permission Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={15} className="text-violet-400" />
                  <div>
                    <div className="text-xs font-medium text-white">Messages</div>
                    <div className="text-[10px] text-white/40">Sending & reading messages</div>
                  </div>
                </div>
                <button
                  onClick={() => updatePermission("messages", !settings.permissions.messages)}
                  className={`px-3 py-1 rounded text-xs font-semibold tracking-wider transition-all ${
                    settings.permissions.messages
                      ? "bg-violet-500 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {settings.permissions.messages ? "ON" : "OFF"}
                </button>
              </div>

              {/* App Access Permission Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <ExternalLink size={15} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-medium text-white">App Access</div>
                    <div className="text-[10px] text-white/40">Opening external apps & links</div>
                  </div>
                </div>
                <button
                  onClick={() => updatePermission("appAccess", !settings.permissions.appAccess)}
                  className={`px-3 py-1 rounded text-xs font-semibold tracking-wider transition-all ${
                    settings.permissions.appAccess
                      ? "bg-cyan-500 text-black font-bold"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {settings.permissions.appAccess ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            {savedSuccess && (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
