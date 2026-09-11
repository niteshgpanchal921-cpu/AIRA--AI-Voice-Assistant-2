export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  provider: "google" | "github" | "password" | "anonymous";
  role: "student/user" | "admin";
  createdAt: string;
  lastLoginAt: string;
  status: "active" | "suspended";
  goals?: string;
  preferences?: string;
  memoryEnabled: boolean;
  language?: string;
  autoDetectLanguage?: boolean;
  actionControlEnabled?: boolean;
  wakeWordEnabled?: boolean;
  wakeWordPhrase?: string;
  callAlertsEnabled?: boolean;
  messageAlertsEnabled?: boolean;
  callControlEnabled?: boolean;
  messageControlEnabled?: boolean;
  appAccessEnabled?: boolean;
  voiceAssistantEnabled?: boolean;
  permissions?: {
    microphone?: "granted" | "denied" | "prompt";
    notifications?: "granted" | "denied" | "prompt";
    calls?: "granted" | "denied" | "prompt";
    messages?: "granted" | "denied" | "prompt";
    appAccess?: "granted" | "denied" | "prompt";
  };
}

export interface UserMemory {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}
