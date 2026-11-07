"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { firebaseClient, firebaseConfigured, cloudError } from "@/lib/firebase";
import {
  emptyWorkoutProgress,
  type UserProfile,
  type WorkoutProgress,
} from "@/lib/firestore/types";
import { AuthForm } from "./auth-form";
type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  progress: WorkoutProgress;
  loading: boolean;
  error: string;
  logout: () => Promise<void>;
};
const Context = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<UserProfile | null>(null),
    [progress, setProgress] = useState<WorkoutProgress>(emptyWorkoutProgress),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    queueMicrotask(online);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    if (!firebaseConfigured) {
      queueMicrotask(() => {
        setLoading(false);
        setError(
          "Firebase is not configured. Set the six variables in .env.local and restart the app.",
        );
      });
      return;
    }
    let stopProfile = () => {},
      stopProgress = () => {};
    try {
      const { auth, db } = firebaseClient();
      const unsubscribe = onAuthStateChanged(
        auth,
        (next) => {
          stopProfile();
          stopProgress();
          setUser(next);
          setProfile(null);
          setProgress(emptyWorkoutProgress());
          setError("");
          setLoading(!!next);
          if (!next) return;
          let profileReady = false,
            progressReady = false;
          const finish = () => {
            if (profileReady && progressReady) setLoading(false);
          };
          const fail = (e: Error) => {
            setError(cloudError(e));
            setLoading(false);
          };
          stopProfile = onSnapshot(
            doc(db, "users", next.uid),
            (s) => {
              setProfile(s.exists() ? (s.data() as UserProfile) : null);
              profileReady = true;
              finish();
            },
            fail,
          );
          stopProgress = onSnapshot(
            doc(db, "workoutProgress", next.uid),
            (s) => {
              setProgress(
                s.exists()
                  ? (s.data() as WorkoutProgress)
                  : emptyWorkoutProgress(),
              );
              progressReady = true;
              finish();
            },
            fail,
          );
        },
        (e) => {
          setError(cloudError(e));
          setLoading(false);
        },
      );
      return () => {
        unsubscribe();
        stopProfile();
        stopProgress();
      };
    } catch (e) {
      queueMicrotask(() => {
        setError(cloudError(e));
        setLoading(false);
      });
    }
  }, [attempt]);
  const logout = async () => {
    await signOut(firebaseClient().auth);
    setProfile(null);
    setProgress(emptyWorkoutProgress());
  };
  return (
    <Context.Provider
      value={{ user, profile, progress, loading, error, logout }}
    >
      {offline && (
        <p role="status" className="panel">
          Offline. Previously loaded data may be visible; reconnect before
          saving changes.
        </p>
      )}
      <AuthGate
        retry={() => {
          setLoading(true);
          setAttempt((n) => n + 1);
        }}
      >
        {children}
      </AuthGate>
    </Context.Provider>
  );
}
function AuthGate({
  children,
  retry,
}: {
  children: React.ReactNode;
  retry: () => void;
}) {
  const { user, profile, loading, error, logout } = useAuth();
  const path = usePathname(),
    router = useRouter();
  const protectedRoute = [
    "/dashboard",
    "/plan",
    "/workout",
    "/diet",
    "/run",
    "/friends",
    "/profile",
    "/exercises",
  ].some((p) => path === p || path.startsWith(p + "/"));
  useEffect(() => {
    if (loading || error) return;
    if (protectedRoute && !user) router.replace("/login");
    if (path === "/login" && user && profile) router.replace("/dashboard");
  }, [loading, error, user, profile, path, protectedRoute, router]);
  if (!protectedRoute && path !== "/login") return children;
  if (loading)
    return (
      <main className="panel" role="status">
        Loading your account...
      </main>
    );
  if (error)
    return (
      <main className="panel">
        <h1>Account unavailable</h1>
        <p role="alert">{error}</p>
        <button className="button secondary" onClick={retry}>
          Retry
        </button>
        {user && (
          <button
            className="button secondary"
            onClick={() => void logout().catch(() => {})}
          >
            Sign out
          </button>
        )}
      </main>
    );
  if (user && !profile)
    return (
      <main className="panel">
        <AuthForm setupOnly />
      </main>
    );
  if ((protectedRoute && !user) || (path === "/login" && user))
    return <main className="panel">Redirecting...</main>;
  return <div key={user?.uid ?? "guest"}>{children}</div>;
}
