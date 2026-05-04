import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
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
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const credential = await signInWithPopup(requireAuth(), provider);
    return credential.user;
  } catch (error) {
    // Importante: não "embrulhar" FirebaseError em Error comum.
    // Precisamos preservar `error.code` para o frontend decidir fallback (popup -> redirect)
    // e para diagnosticar corretamente (unauthorized-domain, popup-blocked, etc).
    throw error;
  }

}

export async function startGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  await signInWithRedirect(requireAuth(), provider);
}

export async function completeGoogleRedirect() {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  const result = await getRedirectResult(auth);
  return result?.user ?? null;
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
