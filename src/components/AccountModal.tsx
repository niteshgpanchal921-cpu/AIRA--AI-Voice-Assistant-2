import React, { useState } from "react";
import { 
  User, 
  Target, 
  Brain, 
  Shield, 
  Link as LinkIcon, 
  LogOut, 
  Trash2, 
  X, 
  Check, 
  Plus, 
  Sparkles, 
  ShieldAlert, 
  Key, 
  Edit3, 
  Mail, 
  Lock,
  Layers,
  ShieldCheck,
  Languages,
  Sliders,
  Bell,
  Phone,
  MessageSquare,
  Radio,
  ExternalLink,
  Volume2
} from "lucide-react";
import { UserProfile, UserMemory } from "../types/user";
import { 
  loginWithGoogle, 
  loginWithApple,
  loginWithGitHub, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  deleteAccountPermanently 
} from "../firebase/authService";
import { 
  updateUserProfile, 
  addMemory, 
  deleteMemory, 
  clearAllMemories, 
  updateMemory 
} from "../firebase/dbService";
import { 
  AIRASettings, 
  SUPPORTED_LANGUAGES, 
  requestBrowserNotificationPermission 
} from "../services/preferenceService";
import { LanguageTab, PermissionsTab } from "./LanguageAndPermissionsTabs";

interface AccountModalProps {
  currentUser: UserProfile | null;
  memories: UserMemory[];
  airaSettings: AIRASettings;
  onSettingsUpdate: (settings: AIRASettings) => void;
  onClose: () => void;
  onUserUpdate: (profile: UserProfile | null) => void;
  onMemoriesUpdate: (memories: UserMemory[]) => void;
  onTestCallAlert?: () => void;
  onTestMessageAlert?: () => void;
}

type TabType = "profile" | "goals" | "memory" | "language" | "permissions" | "privacy" | "connected";

export default function AccountModal({
  currentUser,
  memories,
  airaSettings,
  onSettingsUpdate,
  onClose,
  onUserUpdate,
  onMemoriesUpdate,
  onTestCallAlert,
  onTestMessageAlert,
}: AccountModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [nameSaved, setNameSaved] = useState(false);

  // Goals Edit State
  const [goals, setGoals] = useState(currentUser?.goals || "");
  const [preferences, setPreferences] = useState(currentUser?.preferences || "");
  const [goalsSaved, setGoalsSaved] = useState(false);

  // Memory State
  const [memoryEnabled, setMemoryEnabled] = useState(currentUser?.memoryEnabled ?? true);
  const [newMemoryTitle, setNewMemoryTitle] = useState("");
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemoryTitle, setEditMemoryTitle] = useState("");
  const [editMemoryContent, setEditMemoryContent] = useState("");

  // Delete Account Confirmation Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const profile = await loginWithGoogle();
      onUserUpdate(profile);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to sign in with Google");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const profile = await loginWithApple();
      onUserUpdate(profile);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to sign in with Apple");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const profile = await loginWithGitHub();
      onUserUpdate(profile);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to sign in with GitHub");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      let profile: UserProfile;
      if (authMode === "login") {
        profile = await loginWithEmail(email, password);
      } else {
        profile = await registerWithEmail(email, password, displayName);
      }
      onUserUpdate(profile);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onUserUpdate(null);
    onMemoriesUpdate([]);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccountPermanently();
      onUserUpdate(null);
      onMemoriesUpdate([]);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete account: " + err.message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Profile Save
  const handleSaveProfileName = async () => {
    if (!currentUser || !editName.trim()) return;
    try {
      await updateUserProfile(currentUser.uid, { name: editName.trim() });
      onUserUpdate({ ...currentUser, name: editName.trim() });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Goals Save
  const handleSaveGoals = async () => {
    if (!currentUser) return;
    try {
      await updateUserProfile(currentUser.uid, {
        goals: goals.trim(),
        preferences: preferences.trim(),
      });
      onUserUpdate({ ...currentUser, goals: goals.trim(), preferences: preferences.trim() });
      goalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Memory Toggle
  const handleToggleMemory = async () => {
    if (!currentUser) return;
    const nextState = !memoryEnabled;
    setMemoryEnabled(nextState);
    try {
      await updateUserProfile(currentUser.uid, { memoryEnabled: nextState });
      onUserUpdate({ ...currentUser, memoryEnabled: nextState });
    } catch (err) {
      console.error(err);
    }
  };

  // Add Memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMemoryTitle.trim() || !newMemoryContent.trim()) return;
    try {
      const created = await addMemory(currentUser.uid, newMemoryTitle.trim(), newMemoryContent.trim());
      onMemoriesUpdate([created, ...memories]);
      setNewMemoryTitle("");
      setNewMemoryContent("");
      setIsAddingMemory(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Save Edit Memory
  const handleSaveEditMemory = async (memId: string) => {
    if (!currentUser || !editMemoryTitle.trim() || !editMemoryContent.trim()) return;
    try {
      await updateMemory(currentUser.uid, memId, editMemoryTitle.trim(), editMemoryContent.trim());
      onMemoriesUpdate(
        memories.map((m) =>
          m.id === memId
            ? { ...m, title: editMemoryTitle.trim(), content: editMemoryContent.trim(), updatedAt: new Date().toISOString() }
            : m
        )
      );
      setEditingMemoryId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Memory
  const handleDeleteMemory = async (memId: string) => {
    if (!currentUser) return;
    try {
      await deleteMemory(currentUser.uid, memId);
      onMemoriesUpdate(memories.filter((m) => m.id !== memId));
    } catch (err) {
      console.error(err);
    }
  };

  // Clear All Memories
  const handleClearAllMemories = async () => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to clear all stored memories for this account?")) {
      try {
        await clearAllMemories(currentUser.uid);
        onMemoriesUpdate([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-wide">AIRA Account</h3>
                {currentUser && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      currentUser.role === "admin"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    }`}
                  >
                    {currentUser.role.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50">
                {currentUser ? currentUser.email : "Sign in to save your personal memory and goals"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {!currentUser ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Guest Header Tabs */}
            <div className="flex border-b border-white/10 bg-white/[0.01] px-4 overflow-x-auto scrollbar-hide text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Sign In / Register
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("language")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "language"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                Language ({airaSettings.language})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "permissions"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Permissions & Alerts
              </button>
            </div>

            {/* Guest Tab Content */}
            {activeTab === "language" ? (
              <div className="p-6 overflow-y-auto flex-1 text-sm">
                <LanguageTab
                  settings={airaSettings}
                  onSettingsUpdate={onSettingsUpdate}
                  currentUser={currentUser}
                  onUserUpdate={onUserUpdate}
                />
              </div>
            ) : activeTab === "permissions" ? (
              <div className="p-6 overflow-y-auto flex-1 text-sm">
                <PermissionsTab
                  settings={airaSettings}
                  onSettingsUpdate={onSettingsUpdate}
                  currentUser={currentUser}
                  onTestCallAlert={onTestCallAlert}
                  onTestMessageAlert={onTestMessageAlert}
                />
              </div>
            ) : (
              /* Sign In / Register View */
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-semibold text-white">Welcome to AIRA</h4>
                  <p className="text-xs text-white/60">
                    Connect your account for personalized memory, saved goals, and private settings.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Quick OAuth Providers (Google, Apple, GitHub) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    disabled={authLoading}
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
                    title="Sign in with Google"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    disabled={authLoading}
                    onClick={handleAppleSignIn}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
                    title="Sign in with Apple"
                  >
                    <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.58.67-.99 1.74-.88 2.76 1.01.08 2.03-.51 2.58-1.26z"/>
                    </svg>
                    <span>Apple</span>
                  </button>

                  <button
                    disabled={authLoading}
                    onClick={handleGitHubSignIn}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
                    title="Sign in with GitHub"
                  >
                    <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-[1px] bg-white/10" />
                  <span className="text-[11px] text-white/40 uppercase tracking-wider font-mono">
                    or with email
                  </span>
                  <div className="flex-1 h-[1px] bg-white/10" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-white/60 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors mt-2"
                  >
                    {authLoading
                      ? "Processing..."
                      : authMode === "login"
                      ? "Sign In"
                      : "Create Account"}
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/5">
                  <span>
                    {authMode === "login"
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                    className="text-cyan-400 hover:underline font-medium"
                  >
                    {authMode === "login" ? "Register here" : "Sign In here"}
                  </button>
                </div>

                {/* Guest Mode Assurance & Creator Attribution */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                  <p className="text-[11px] text-white/50">
                    ✨ <strong>Guest Mode Active:</strong> You can continue using AIRA voice commands and chat without signing in.
                  </p>
                  <p className="text-[10px] text-cyan-400/60 font-mono">
                    AIRA Voice Assistant • Built by NITESH.G.PANCHAL
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Authenticated User Account Panel */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-white/10 bg-white/[0.01] px-4 overflow-x-auto scrollbar-hide text-xs">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "goals"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Goals
              </button>
              <button
                onClick={() => setActiveTab("memory")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "memory"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                Memory ({memories.length})
              </button>
              <button
                onClick={() => setActiveTab("language")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "language"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                Language
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "permissions"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Permissions
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "privacy"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Privacy
              </button>
              <button
                onClick={() => setActiveTab("connected")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "connected"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Connected
              </button>
              <button
                onClick={() => setActiveTab("language")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "language"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                Language ({airaSettings.language})
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "permissions"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Permissions & Alerts
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
              
              {/* TAB 1: PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Display Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleSaveProfileName}
                          className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium text-xs flex items-center gap-1 transition-colors"
                        >
                          {nameSaved ? <Check className="w-3.5 h-3.5" /> : "Save"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-1">Email</label>
                      <input
                        type="text"
                        readOnly
                        value={currentUser.email}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 text-sm text-white/70 font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-white/50 uppercase font-mono block">Status</span>
                      <span className="text-xs font-semibold text-emerald-400 capitalize">{currentUser.status}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-white/50 uppercase font-mono block">Role</span>
                      <span className="text-xs font-semibold text-cyan-300 capitalize">{currentUser.role}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-white/50 uppercase font-mono block">Provider</span>
                      <span className="text-xs font-mono capitalize text-white/80">{currentUser.provider}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-white/50 uppercase font-mono block">Created</span>
                      <span className="text-xs font-mono text-white/70">
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50 flex items-center justify-between font-mono">
                    <span>Firebase UID: {currentUser.uid.slice(0, 16)}...</span>
                    <span>Last login: {new Date(currentUser.lastLoginAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              {/* TAB 2: GOALS & PREFERENCES */}
              {activeTab === "goals" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Personal Goals (e.g. Become a software engineer, Learn AI, Pass interview)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="What are you currently working on or aspiring to achieve?"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Personality & Assistant Preferences
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Keep answers super short, use more Hinglish, challenge my thinking"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-white/40">
                      AIRA will remember your goals and tailor her advice accordingly.
                    </p>
                    <button
                      onClick={handleSaveGoals}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {goalsSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Saved!
                        </>
                      ) : (
                        "Save Goals"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: MEMORY */}
              {activeTab === "memory" && (
                <div className="space-y-4">
                  {/* Memory Switch */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-2">
                        <Brain className="w-4 h-4 text-cyan-400" />
                        Active Memory System
                      </div>
                      <p className="text-[11px] text-white/50">
                        When enabled, AIRA incorporates your saved memories into responses.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleMemory}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        memoryEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/10 text-white/50 border-white/20"
                      }`}
                    >
                      {memoryEnabled ? "MEMORY ON" : "MEMORY OFF"}
                    </button>
                  </div>

                  {/* Add memory trigger / form */}
                  {!isAddingMemory ? (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setIsAddingMemory(true)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cyan-400 flex items-center gap-1.5 font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Memory
                      </button>
                      {memories.length > 0 && (
                        <button
                          onClick={handleClearAllMemories}
                          className="text-xs text-red-400/80 hover:text-red-400 transition-colors"
                        >
                          Clear all memory
                        </button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleAddMemory} className="p-3.5 rounded-xl bg-white/[0.02] border border-cyan-500/30 space-y-3">
                      <div className="text-xs font-semibold text-cyan-300">Add Custom Memory Fact</div>
                      <input
                        type="text"
                        required
                        placeholder="Memory Title (e.g. Favorite Tech Stack, Birthday, Dog's name)"
                        value={newMemoryTitle}
                        onChange={(e) => setNewMemoryTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                      <textarea
                        required
                        rows={2}
                        placeholder="Details for AIRA to remember..."
                        value={newMemoryContent}
                        onChange={(e) => setNewMemoryContent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingMemory(false)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 text-xs text-white/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs"
                        >
                          Save Memory
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Memories List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {memories.length === 0 ? (
                      <div className="p-6 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-xl">
                        No stored memories yet. Add facts you want AIRA to remember across sessions!
                      </div>
                    ) : (
                      memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          {editingMemoryId === m.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editMemoryTitle}
                                onChange={(e) => setEditMemoryTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                              />
                              <textarea
                                rows={2}
                                value={editMemoryContent}
                                onChange={(e) => setEditMemoryContent(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingMemoryId(null)}
                                  className="text-[11px] text-white/50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEditMemory(m.id)}
                                  className="text-[11px] text-cyan-400 font-semibold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-xs text-white/90">{m.title}</div>
                                <div className="text-xs text-white/60 mt-0.5">{m.content}</div>
                                <div className="text-[10px] text-white/30 font-mono mt-1">
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingMemoryId(m.id);
                                    setEditMemoryTitle(m.title);
                                    setEditMemoryContent(m.content);
                                  }}
                                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                                  title="Edit memory"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMemory(m.id)}
                                  className="p-1 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400"
                                  title="Delete memory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVACY */}
              {activeTab === "privacy" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                      <Shield className="w-4 h-4" />
                      Data Isolation & Security Guarantee
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your AIRA account data is segregated under your private Firebase UID:
                      <code className="block bg-black/40 p-2 rounded-lg font-mono text-[11px] text-cyan-300 my-2">
                        users/{currentUser.uid}/*
                      </code>
                      Other users have zero access to your stored goals, preferences, or personal memory facts.
                    </p>
                    <ul className="text-xs text-white/60 space-y-1.5 list-disc list-inside">
                      <li>No profile photos are collected or stored.</li>
                      <li>Memory entries are only fetched for your active session.</li>
                      <li>You can delete your stored data at any time.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 5: CONNECTED ACCOUNTS */}
              {activeTab === "connected" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 font-mono text-xs uppercase text-white/80">
                        {currentUser.provider}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Primary Identity Provider</div>
                        <div className="text-[11px] text-white/50">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CONNECTED
                    </span>
                  </div>

                  <p className="text-xs text-white/40">
                    Your account is securely bound to your authentication provider.
                  </p>
                </div>
              )}

              {/* TAB 6: LANGUAGE */}
              {activeTab === "language" && (
                <LanguageTab
                  settings={airaSettings}
                  onSettingsUpdate={onSettingsUpdate}
                  currentUser={currentUser}
                  onUserUpdate={onUserUpdate}
                />
              )}

              {/* TAB 7: PERMISSIONS */}
              {activeTab === "permissions" && (
                <PermissionsTab
                  settings={airaSettings}
                  onSettingsUpdate={onSettingsUpdate}
                  currentUser={currentUser}
                  onTestCallAlert={onTestCallAlert}
                  onTestMessageAlert={onTestMessageAlert}
                />
              )}

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-red-500/40 rounded-2xl p-6 max-w-sm text-center text-white space-y-4 shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Permanently Delete Account?</h4>
            <p className="text-xs text-white/60">
              This will erase all your personal memories, saved goals, and account credentials. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                disabled={deleteLoading}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white/80"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
