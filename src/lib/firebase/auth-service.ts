import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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
    if (error instanceof FirebaseError && error.code === "auth/popup-closed-by-user") {
      throw new Error(
        "Login cancelado: a janela do Google foi fechada. Se seu navegador estiver bloqueando popups (ou Safari/aba anônima), permita popups e tente novamente.",
      );
    }

    if (error instanceof FirebaseError && error.code === "auth/popup-blocked") {
      throw new Error(
        "Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.",
      );
    }

    if (error instanceof FirebaseError && error.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domínio não autorizado no Firebase Auth. Verifique os domínios autorizados (ex.: localhost:3000 e seu domínio da Vercel).",
      );
    }

    throw error;
  }

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
