import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  deleteUser,
  User 
} from "firebase/auth";
import { auth, googleProvider, githubProvider, appleProvider } from "./config";
import { syncUserProfile, deleteUserAccountData } from "./dbService";
import { UserProfile } from "../types/user";

export async function loginWithGoogle(): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, googleProvider);
  return await syncUserProfile(cred.user);
}

export async function loginWithApple(): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, appleProvider);
  return await syncUserProfile(cred.user);
}

export async function loginWithGitHub(): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, githubProvider);
  return await syncUserProfile(cred.user);
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(cred.user);
}

export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return await syncUserProfile({
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: name.trim() || cred.user.displayName,
    providerData: cred.user.providerData,
  });
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function deleteAccountPermanently(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  const uid = user.uid;
  // Delete firestore data
  await deleteUserAccountData(uid);
  // Delete auth user
  await deleteUser(user);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
