export type SupportedLanguageCode =
  | "en"
  | "hi"
  | "kn"
  | "te"
  | "ta"
  | "ml"
  | "mr"
  | "bn"
  | "gu"
  | "pa"
  | "ur"
  | "th";

export interface LanguageInfo {
  code: SupportedLanguageCode;
  label: string;
  native: string;
  speechLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", label: "English", native: "English", speechLang: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speechLang: "hi-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", speechLang: "kn-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", speechLang: "te-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speechLang: "ta-IN" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", speechLang: "ml-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", speechLang: "mr-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", speechLang: "bn-IN" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", speechLang: "gu-IN" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", speechLang: "pa-IN" },
  { code: "ur", label: "Urdu", native: "اردو", speechLang: "ur-IN" },
  { code: "th", label: "Thai", native: "ไทย", speechLang: "th-TH" },
];

export interface AppPermissions {
  microphone: boolean;
  notifications: boolean;
  calls: boolean;
  messages: boolean;
  appAccess: boolean;
  wakeWord: boolean;
  callAlerts: boolean;
  messageAlerts: boolean;
  voiceAssistant: boolean;
  actionControl: boolean;
}

export interface ControlSettings {
  voiceAssistantEnabled: boolean;
  wakeWordEnabled: boolean;
  wakeWordPhrase: string;
  actionControlEnabled: boolean;
  callAlertsEnabled: boolean;
  messageAlertsEnabled: boolean;
  language: SupportedLanguageCode;
  autoDetectLanguage: boolean;
  permissions: AppPermissions;
}

export const DEFAULT_CONTROLS: ControlSettings = {
  voiceAssistantEnabled: true,
  wakeWordEnabled: true,
  wakeWordPhrase: "Hey AIRA",
  actionControlEnabled: true,
  callAlertsEnabled: true,
  messageAlertsEnabled: true,
  language: "en",
  autoDetectLanguage: true,
  permissions: {
    microphone: false,
    notifications: false,
    calls: true,
    messages: true,
    appAccess: true,
    wakeWord: true,
    callAlerts: true,
    messageAlerts: true,
    voiceAssistant: true,
    actionControl: true,
  },
};
