import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

function requireAuth() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase Auth ainda não está configurado.");
  }

  return auth;
}

export async function signInWithPassword(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);

  return credential.user;
}

export async function createPasswordAccount(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);

  return credential.user;
}

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(requireAuth(), provider);

  return credential.user;
}

export async function logoutFirebaseUser() {
  await signOut(requireAuth());
}

export function subscribeToFirebaseUser(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();

  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, callback);
}
