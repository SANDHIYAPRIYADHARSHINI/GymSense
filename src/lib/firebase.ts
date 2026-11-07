import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);
// Lazy initialization keeps builds and public pages usable without credentials.
// Firestore uses its default memory cache; no private records persist to disk.
export function firebaseClient() {
  if (!firebaseConfigured)
    throw new Error(
      "Firebase is not configured. Set the six NEXT_PUBLIC_FIREBASE variables and restart the app.",
    );
  const app = getApps().length ? getApp() : initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}
export function cloudError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code.includes("permission-denied"))
    return "Access denied. Check the deployed Firestore rules and your signed-in account.";
  if (code.includes("unavailable") || code.includes("network"))
    return "You are offline or Firebase is unreachable. Reconnect and retry; this change has not been confirmed saved.";
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  )
    return "Unable to sign in with that email and password.";
  if (code.includes("email-already-in-use"))
    return "That email already has an account. Sign in or reset your password.";
  if (code.includes("too-many-requests"))
    return "Too many attempts. Please wait before trying again.";
  if (code.includes("weak-password"))
    return "Choose a stronger password that meets your Firebase project's password policy.";
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please retry.";
}
export function requireOnline() {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new Error(
      "You are offline. Reconnect before saving; keep this page open to retry.",
    );
}
