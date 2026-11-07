"use client";
import { useState } from "react";
import { RunHistory } from "@/components/run-history";
import { PageHeading } from "@/components/landing";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/components/auth-provider";
import { profileView, todayUTC } from "@/lib/firestore/streaks";
import { updateUser } from "@/lib/firestore/users";
import { cloudError } from "@/lib/firebase";
import type { Goal, UserProfile } from "@/lib/firestore/types";
export default function Page() {
  const { profile, progress, logout } = useAuth();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (!profile) return null;
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      await updateUser(profile.uid, {
        displayName: String(data.get("name")).trim(),
        goal: String(data.get("goal")) as Goal,
        fitnessLevel: String(data.get("level")) as UserProfile["fitnessLevel"],
      });
      setMessage("Profile saved.");
    } catch (e) {
      setMessage(cloudError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="EVERY DAY ADDS UP"
        title="Your effort has a story."
        description="Your account and saved training activity. Dates use UTC."
      />
      <ProfileCard
        user={profileView(profile, Object.values(progress.activity))}
        endDate={todayUTC()}
        action={
          <button
            className="button secondary"
            onClick={() =>
              void logout().catch((e) => setMessage(cloudError(e)))
            }
          >
            Sign out
          </button>
        }
      />
      <form onSubmit={save} className="panel mt-6 space-y-4">
        <h2>Edit profile</h2>
        <label className="block">
          Display name
          <input
            className="plan-input"
            name="name"
            defaultValue={profile.displayName}
            required
            maxLength={80}
          />
        </label>
        <label className="block">
          Goal
          <select
            name="goal"
            defaultValue={profile.goal}
            className="plan-input"
          >
            <option value="weight-gain">Weight Gain</option>
            <option value="weight-loss">Weight Loss</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="block">
          Fitness level
          <select
            name="level"
            defaultValue={profile.fitnessLevel}
            className="plan-input"
          >
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
        </label>
        <button disabled={busy} className="button primary">
          {busy ? "Saving..." : "Save profile"}
        </button>
        <p role="status">{message}</p>
      </form>
      <RunHistory />
    </>
  );
}
