import { ControlSettings, SupportedLanguageCode } from "../types/controls";

export interface AIRAPermissions {
  microphone: "granted" | "denied" | "prompt";
  notifications: "granted" | "denied" | "prompt";
  calls: "granted" | "denied" | "prompt";
  messages: "granted" | "denied" | "prompt";
  appAccess: "granted" | "denied" | "prompt";
}

export interface AIRASettings {
  voiceAssistantEnabled: boolean;
  wakeWordEnabled: boolean;
  wakeWordPhrase: string;
  actionControlEnabled: boolean;
  callAlertsEnabled: boolean;
  messageAlertsEnabled: boolean;
  callControlEnabled: boolean;
  messageControlEnabled: boolean;
  appAccessEnabled: boolean;
  language: string;
  autoDetectLanguage: boolean;
  permissions: AIRAPermissions;
}

export interface SupportedLanguage {
  id: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: "en", name: "English", nativeName: "English", speechCode: "en-IN" },
  { id: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { id: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { id: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { id: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { id: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN" },
  { id: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { id: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { id: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { id: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { id: "ur", name: "Urdu", nativeName: "اردو", speechCode: "ur-IN" },
  { id: "th", name: "Thai", nativeName: "ไทย", speechCode: "th-TH" },
];

const DEFAULT_SETTINGS: AIRASettings = {
  voiceAssistantEnabled: true,
  wakeWordEnabled: true,
  wakeWordPhrase: "Hey AIRA",
  actionControlEnabled: true,
  callAlertsEnabled: true,
  messageAlertsEnabled: true,
  callControlEnabled: true,
  messageControlEnabled: true,
  appAccessEnabled: true,
  language: "English",
  autoDetectLanguage: true,
  permissions: {
    microphone: "prompt",
    notifications: "prompt",
    calls: "prompt",
    messages: "prompt",
    appAccess: "prompt",
  },
};

const STORAGE_KEY = "aira_addon_settings";

export function loadAIRASettings(): AIRASettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      permissions: {
        ...DEFAULT_SETTINGS.permissions,
        ...(parsed.permissions || {}),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveAIRASettings(settings: AIRASettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save AIRA settings locally", e);
  }
}

export function parseLanguageName(name: string): string {
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.name.toLowerCase() === name.toLowerCase() || l.id.toLowerCase() === name.toLowerCase()
  );
  return match ? match.speechCode : "en-IN";
}

export async function checkBrowserPermissions(): Promise<Partial<AIRAPermissions>> {
  const result: Partial<AIRAPermissions> = {};

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      result.notifications = "granted";
    } else if (Notification.permission === "denied") {
      result.notifications = "denied";
    } else {
      result.notifications = "prompt";
    }
  }

  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    try {
      const micStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (micStatus.state === "granted") result.microphone = "granted";
      else if (micStatus.state === "denied") result.microphone = "denied";
      else result.microphone = "prompt";
    } catch {
      // Ignore if not supported
    }
  }

  return result;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

const LANG_TO_CODE: Record<string, SupportedLanguageCode> = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
  Telugu: "te",
  Tamil: "ta",
  Malayalam: "ml",
  Marathi: "mr",
  Bengali: "bn",
  Gujarati: "gu",
  Punjabi: "pa",
  Urdu: "ur",
  Thai: "th",
};

const CODE_TO_LANG: Record<SupportedLanguageCode, string> = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  te: "Telugu",
  ta: "Tamil",
  ml: "Malayalam",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
  ur: "Urdu",
  th: "Thai",
};

export function toControlSettings(aira: AIRASettings): ControlSettings {
  const langCode = LANG_TO_CODE[aira.language] || "en";
  return {
    voiceAssistantEnabled: aira.voiceAssistantEnabled,
    wakeWordEnabled: aira.wakeWordEnabled,
    wakeWordPhrase: aira.wakeWordPhrase,
    actionControlEnabled: aira.actionControlEnabled ?? true,
    callAlertsEnabled: aira.callAlertsEnabled,
    messageAlertsEnabled: aira.messageAlertsEnabled,
    language: langCode,
    autoDetectLanguage: aira.autoDetectLanguage,
    permissions: {
      microphone: aira.permissions.microphone === "granted",
      notifications: aira.permissions.notifications === "granted",
      calls: aira.permissions.calls === "granted",
      messages: aira.permissions.messages === "granted",
      appAccess: aira.permissions.appAccess === "granted",
      wakeWord: aira.wakeWordEnabled,
      callAlerts: aira.callAlertsEnabled,
      messageAlerts: aira.messageAlertsEnabled,
      voiceAssistant: aira.voiceAssistantEnabled,
      actionControl: aira.actionControlEnabled ?? true,
    },
  };
}

export function toAIRASettings(controls: ControlSettings, previous?: AIRASettings): AIRASettings {
  const langName = CODE_TO_LANG[controls.language] || "English";
  return {
    voiceAssistantEnabled: controls.voiceAssistantEnabled,
    wakeWordEnabled: controls.wakeWordEnabled,
    wakeWordPhrase: controls.wakeWordPhrase,
    actionControlEnabled: controls.actionControlEnabled ?? true,
    callAlertsEnabled: controls.callAlertsEnabled,
    messageAlertsEnabled: controls.messageAlertsEnabled,
    callControlEnabled: controls.permissions.calls,
    messageControlEnabled: controls.permissions.messages,
    appAccessEnabled: controls.permissions.appAccess,
    language: langName,
    autoDetectLanguage: controls.autoDetectLanguage,
    permissions: {
      microphone: controls.permissions.microphone ? "granted" : (previous?.permissions?.microphone === "denied" ? "denied" : "prompt"),
      notifications: controls.permissions.notifications ? "granted" : (previous?.permissions?.notifications === "denied" ? "denied" : "prompt"),
      calls: controls.permissions.calls ? "granted" : "denied",
      messages: controls.permissions.messages ? "granted" : "denied",
      appAccess: controls.permissions.appAccess ? "granted" : "denied",
    },
  };
}
