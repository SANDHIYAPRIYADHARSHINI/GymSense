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
import {
  DEMO_USER,
  demoPreference,
  saveDemoPreference,
  setDemoSession,
  demoSnapshot,
  watchDemo,
  resetDemo,
  demoStorageWarning,
} from "@/lib/demo/store";
import { AuthForm } from "./auth-form";
type AuthState = {
  user: Pick<User, "uid" | "email"> | null;
  profile: UserProfile | null;
  progress: WorkoutProgress;
  loading: boolean;
  error: string;
  isDemo: boolean;
  enterDemo: () => void;
  resetDemoData: () => void;
  logout: () => Promise<void>;
};
const Context = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null),
    [profile, setProfile] = useState<UserProfile | null>(null),
    [progress, setProgress] = useState<WorkoutProgress>(emptyWorkoutProgress),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [demo, setDemo] = useState<boolean | null>(null),
    [attempt, setAttempt] = useState(0),
    [offline, setOffline] = useState(false),
    [epoch, setEpoch] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const preference = demoPreference();
    queueMicrotask(() =>
      setDemo(
        preference === "demo" ||
          (!firebaseConfigured && preference !== "firebase"),
      ),
    );
    const online = () => setOffline(navigator.onLine === false);
    queueMicrotask(online);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    if (demo === null) return;
    setDemoSession(demo);
    if (demo) {
      return watchDemo(() => {
        const data = demoSnapshot();
        setUser(DEMO_USER);
        setProfile({ ...data.profile });
        setProgress({ ...data.progress });
        setLoading(false);
        setError("");
      });
    }
    if (!firebaseConfigured) {
      queueMicrotask(() => {
        setUser(null);
        setProfile(null);
        setProgress(emptyWorkoutProgress());
        setLoading(false);
        setError(
          "Firebase sign-in needs project configuration. You can explore every feature in demo mode now.",
        );
      });
      return;
    }
    let stopProfile = () => {},
      stopProgress = () => {};
    try {
      const { auth, db } = firebaseClient();
      const stopAuth = onAuthStateChanged(
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
        stopAuth();
        stopProfile();
        stopProgress();
      };
    } catch (e) {
      queueMicrotask(() => {
        setError(cloudError(e));
        setLoading(false);
      });
    }
  }, [demo, attempt]);
  function enterDemo() {
    saveDemoPreference("demo");
    setLoading(true);
    setError("");
    setDemo(true);
  }
  function resetDemoData() {
    resetDemo();
    setEpoch((e) => e + 1);
  }
  async function logout() {
    if (demo) {
      saveDemoPreference("firebase");
      setLoading(true);
      setDemo(false);
      setDemoSession(false);
    } else await signOut(firebaseClient().auth);
    setUser(null);
    setProfile(null);
    setProgress(emptyWorkoutProgress());
    router.replace("/login");
  }
  return (
    <Context.Provider
      value={{
        user,
        profile,
        progress,
        loading,
        error,
        isDemo: demo === true,
        enterDemo,
        resetDemoData,
        logout,
      }}
    >
      {offline && !demo && (
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
        <div key={`${demo}:${epoch}`}>{children}</div>
      </AuthGate>
    </Context.Provider>
  );
}
export function DemoBanner() {
  const { isDemo, resetDemoData, logout } = useAuth();
  if (!isDemo) return null;
  return (
    <section
      aria-label="Demo mode"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ccf66b]/30 bg-[#ccf66b]/5 p-4 text-sm"
    >
      <div className="min-w-48 flex-1">
        <strong className="text-[#ccf66b]">DEMO MODE</strong>
        <p className="mt-1 text-xs">
          Sample account. Changes stay in this tab and never sync to Firebase.
          {demoStorageWarning()
            ? " Browser storage is blocked; changes will reset on refresh."
            : " Refresh keeps this tab's demo progress."}
        </p>
      </div>
      <button
        type="button"
        className="button secondary"
        onClick={resetDemoData}
      >
        Reset demo
      </button>
      <button
        type="button"
        className="button secondary"
        onClick={() => void logout()}
      >
        Firebase login
      </button>
    </section>
  );
}
function AuthGate({
  children,
  retry,
}: {
  children: React.ReactNode;
  retry: () => void;
}) {
  const { user, profile, loading, error, logout, enterDemo } = useAuth();
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
    if (path === "/login" && user && profile) router.replace("/");
  }, [loading, error, user, profile, path, protectedRoute, router]);
  if (!protectedRoute && path !== "/login") return children;
  if (loading)
    return (
      <main className="panel" role="status">
        Loading your workspace...
      </main>
    );
  if (error)
    return (
      <main className="panel">
        <h1>{firebaseConfigured ? "Account unavailable" : "Try GymSense"}</h1>
        <p role="alert" className="my-4">
          {error}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="button primary" onClick={enterDemo}>
            Continue in demo mode
          </button>
          {firebaseConfigured && (
            <button className="button secondary" onClick={retry}>
              Retry Firebase
            </button>
          )}
          {user && (
            <button
              className="button secondary"
              onClick={() => void logout().catch(() => {})}
            >
              Sign out
            </button>
          )}
        </div>
        {!firebaseConfigured && (
          <p className="mt-5 text-xs">
            For a real account, fill the six Firebase values in .env.local and
            restart the server. Demo mode needs no account or configuration.
          </p>
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
