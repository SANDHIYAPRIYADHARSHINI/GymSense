"use client";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { firebaseClient, cloudError, requireOnline } from "@/lib/firebase";
import { createProfile, normalizeUsername } from "@/lib/firestore/users";
import type { Goal } from "@/lib/firestore/types";
import { useAuth } from "./auth-provider";
export function AuthForm({ setupOnly = false }: { setupOnly?: boolean }) {
  const { user, logout, enterDemo } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget),
      email = String(data.get("email") ?? "").trim(),
      password = String(data.get("password") ?? "");
    try {
      requireOnline();
      const { auth } = firebaseClient();
      if (setupOnly || mode === "signup") {
        const username = normalizeUsername(String(data.get("username"))),
          displayName = String(data.get("displayName")).trim(),
          goal = String(data.get("goal")) as Goal;
        const account =
          user ??
          (await createUserWithEmailAndPassword(auth, email, password)).user;
        await createProfile(account, { username, displayName, goal });
      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMessage(
          "If an account exists for that email, a reset link will be sent. Check your inbox.",
        );
      } else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setMessage(cloudError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-wrap">
      <h1>
        {setupOnly
          ? "Finish your profile"
          : mode === "signup"
            ? "Find your stronger."
            : mode === "reset"
              ? "Reset your password"
              : "Welcome back."}
      </h1>
      <p className="my-4">
        {setupOnly
          ? "Your sign-in account is ready. Choose a unique username to continue."
          : "Your progress, synced to your account."}
      </p>
      {!setupOnly && (
        <button
          type="button"
          className="button secondary mb-5 full"
          onClick={enterDemo}
        >
          Continue in demo mode
        </button>
      )}
      <form onSubmit={submit} className="panel login-form">
        {!setupOnly && (
          <>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
            {mode !== "reset" && (
              <>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
              </>
            )}
          </>
        )}
        {(setupOnly || mode === "signup") && (
          <>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              required
              pattern="[a-zA-Z0-9_]{3,24}"
              minLength={3}
              maxLength={24}
              autoComplete="username"
            />
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              required
              maxLength={80}
              autoComplete="name"
            />
            <label htmlFor="goal">Goal</label>
            <select id="goal" name="goal" className="plan-input">
              <option value="weight-gain">Weight Gain</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="custom">Custom</option>
            </select>
            <p className="helper">
              Your username, display name and goal are searchable by signed-in
              members. Activity is shared only with accepted friends.
            </p>
          </>
        )}
        <button className="button primary" disabled={busy}>
          {busy
            ? "Please wait..."
            : setupOnly
              ? "Save profile"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
        </button>
        {message && <p role="status">{message}</p>}
      </form>
      {setupOnly ? (
        <button
          className="button secondary"
          onClick={() => void logout().catch((e) => setMessage(cloudError(e)))}
        >
          Sign out
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {(["login", "signup", "reset"] as const)
            .filter((m) => m !== mode)
            .map((m) => (
              <button
                key={m}
                disabled={busy}
                className="button secondary"
                onClick={() => {
                  setMode(m);
                  setMessage("");
                }}
              >
                {m === "login"
                  ? "Sign in"
                  : m === "signup"
                    ? "Create account"
                    : "Forgot password?"}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
