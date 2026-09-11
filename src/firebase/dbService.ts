import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  writeBatch 
} from "firebase/firestore";
import { db } from "./config";
import { UserProfile, UserMemory } from "../types/user";

export const CREATOR_EMAIL = "niteshgpanchal921@gmail.com";

// Sync or initialize user profile in Firestore
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerData: Array<{ providerId: string }>;
}): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const isOwnerAdmin = (user.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase());

  let provider: "google" | "github" | "password" = "password";
  const pId = user.providerData?.[0]?.providerId;
  if (pId?.includes("google")) provider = "google";
  else if (pId?.includes("github")) provider = "github";

  const now = new Date().toISOString();

  if (userSnap.exists()) {
    const existing = userSnap.data() as UserProfile;
    // Always grant admin to creator if not already set
    const shouldBeAdmin = isOwnerAdmin || existing.role === "admin";
    const updated: Partial<UserProfile> = {
      lastLoginAt: now,
      role: shouldBeAdmin ? "admin" : existing.role,
    };
    await updateDoc(userRef, updated);
    return { ...existing, ...updated };
  } else {
    // Create new profile without any photo
    const newProfile: UserProfile = {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email || "",
      provider,
      role: isOwnerAdmin ? "admin" : "student/user",
      createdAt: now,
      lastLoginAt: now,
      status: "active",
      goals: "",
      preferences: "",
      memoryEnabled: true,
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// Update profile details (Name, Goals, Preferences, memoryEnabled, language, settings, etc.)
export async function updateUserProfile(
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
}

// Memory Operations
export async function getUserMemories(uid: string): Promise<UserMemory[]> {
  try {
    const memoriesRef = collection(db, "users", uid, "memories");
    const q = query(memoriesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<UserMemory, "id">),
    }));
  } catch (error) {
    console.error("Error loading memories:", error);
    return [];
  }
}

export async function addMemory(
  uid: string, 
  title: string, 
  content: string, 
  category: string = "General"
): Promise<UserMemory> {
  const memoriesRef = collection(db, "users", uid, "memories");
  const now = new Date().toISOString();
  const docRef = await addDoc(memoriesRef, {
    title,
    content,
    category,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    title,
    content,
    category,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateMemory(
  uid: string, 
  memoryId: string, 
  title: string, 
  content: string, 
  category: string = "General"
): Promise<void> {
  const memRef = doc(db, "users", uid, "memories", memoryId);
  await updateDoc(memRef, {
    title,
    content,
    category,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMemory(uid: string, memoryId: string): Promise<void> {
  const memRef = doc(db, "users", uid, "memories", memoryId);
  await deleteDoc(memRef);
}

export async function clearAllMemories(uid: string): Promise<void> {
  const memoriesRef = collection(db, "users", uid, "memories");
  const snapshot = await getDocs(memoriesRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// Admin Operations (Protected by security rules & role checks)
export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserRoleByAdmin(
  targetUid: string, 
  newRole: "student/user" | "admin"
): Promise<void> {
  const targetRef = doc(db, "users", targetUid);
  await updateDoc(targetRef, { role: newRole });
}

export async function updateUserStatusByAdmin(
  targetUid: string, 
  newStatus: "active" | "suspended"
): Promise<void> {
  const targetRef = doc(db, "users", targetUid);
  await updateDoc(targetRef, { status: newStatus });
}

export async function deleteUserAccountData(uid: string): Promise<void> {
  // Clear memories first
  await clearAllMemories(uid);
  // Delete user doc
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
}
