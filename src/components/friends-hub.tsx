"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { PageHeading } from "./landing";
import { ProfileCard, UserAvatar } from "./profile-card";
import { cloudError } from "@/lib/firebase";
import { searchUsers, getPublicProfile } from "@/lib/firestore/users";
import {
  watchFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendOrRequest,
  getFriendActivity,
  friendsFromRequests,
  watchChallenges,
  saveChallenges,
} from "@/lib/firestore/friends";
import { profileView, todayUTC } from "@/lib/firestore/streaks";
import { profileStats } from "@/lib/social";
import type { FriendRequest, PublicProfile } from "@/lib/firestore/types";
import type { UserActivity } from "@/data/users";
export function FriendsHub() {
  const { user, profile, progress } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]),
    [profiles, setProfiles] = useState<PublicProfile[]>([]),
    [results, setResults] = useState<PublicProfile[]>([]),
    [text, setText] = useState(""),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<{
      profile: PublicProfile;
      activity: UserActivity[];
    } | null>(null);
  const generation = useRef(0);
  const [joined, setJoined] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    return watchChallenges(user.uid, setJoined, (e) =>
      setMessage(cloudError(e)),
    );
  }, [user]);
  useEffect(() => {
    if (!user) return;
    return watchFriendRequests(
      user.uid,
      (r) => {
        setRequests(r);
        setReady(true);
      },
      (e) => {
        setMessage(cloudError(e));
        setReady(true);
      },
    );
  }, [user]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const ids = [
      ...new Set(
        requests.flatMap((r) => r.members).filter((id) => id !== user.uid),
      ),
    ];
    Promise.all(ids.map(getPublicProfile))
      .then((p) => {
        if (active) setProfiles(p.filter((p): p is PublicProfile => !!p));
      })
      .catch((e) => {
        if (active) setMessage(cloudError(e));
      });
    return () => {
      active = false;
    };
  }, [user, requests]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      searchUsers(text)
        .then((p) => {
          if (active) setResults(p.filter((p) => p.uid !== user?.uid));
        })
        .catch((e) => {
          if (active) setMessage(cloudError(e));
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, user?.uid]);
  if (!user || !profile) return null;
  const uid = user.uid,
    friendIds = friendsFromRequests(uid, requests),
    friends = profiles.filter((p) => friendIds.includes(p.uid));
  const stats = profileStats(
    profileView(profile, Object.values(progress.activity)),
    todayUTC(),
  );
  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage(cloudError(e));
    } finally {
      setBusy(false);
    }
  }
  async function show(p: PublicProfile) {
    const id = ++generation.current;
    setPreview(null);
    await act(async () => {
      const activity = await getFriendActivity(p.uid);
      if (id === generation.current) setPreview({ profile: p, activity });
    });
  }
  function person(id: string) {
    return profiles.find((p) => p.uid === id)?.displayName ?? "GymSense member";
  }
  return (
    <>
      <PageHeading
        eyebrow="STRONGER TOGETHER"
        title="Find your people."
        description="Search by username, exchange friend requests, and share progress with accepted friends."
      />
      {message && (
        <p role="alert" className="panel">
          {message}
        </p>
      )}
      <section className="panel mb-6">
        <label htmlFor="friend-search">Search usernames</label>
        <input
          id="friend-search"
          className="plan-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="@username"
        />
        {text && !results.length && (
          <p className="mt-4">No matching members.</p>
        )}
        {results.map((p) => {
          const existing = requests.find(
            (r) => r.members.includes(p.uid) && r.status !== "rejected",
          );
          return (
            <div
              key={p.uid}
              className="flex flex-wrap items-center gap-4 border-b border-white/10 py-4"
            >
              <UserAvatar user={profileView(p)} />
              <span className="flex-1">
                {p.displayName}
                <small className="block">@{p.username}</small>
              </span>
              <button
                disabled={busy || !!existing}
                className="button secondary"
                onClick={() => void act(() => sendFriendRequest(uid, p.uid))}
              >
                {existing?.status === "accepted"
                  ? "Friends"
                  : existing
                    ? "Request pending"
                    : "Add friend"}
              </button>
            </div>
          );
        })}
      </section>
      <section className="panel mb-6">
        <h2>Friend requests</h2>
        {!ready ? (
          <p>Loading...</p>
        ) : !requests.some((r) => r.status === "pending") ? (
          <p>No pending requests.</p>
        ) : (
          requests
            .filter((r) => r.status === "pending")
            .map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 py-4"
              >
                <span className="flex-1">
                  {r.to === uid
                    ? `From ${person(r.from)}`
                    : `Sent to ${person(r.to)}`}
                </span>
                {r.to === uid ? (
                  <>
                    <button
                      disabled={busy}
                      className="button primary"
                      onClick={() =>
                        void act(() => respondToFriendRequest(r.id, "accepted"))
                      }
                    >
                      Accept
                    </button>
                    <button
                      disabled={busy}
                      className="button secondary"
                      onClick={() =>
                        void act(() => respondToFriendRequest(r.id, "rejected"))
                      }
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    disabled={busy}
                    className="button secondary"
                    onClick={() => void act(() => removeFriendOrRequest(r.id))}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))
        )}
      </section>
      <section className="panel mb-6">
        <h2>Your friends</h2>
        {ready && !friends.length && (
          <p className="mt-4">No friends yet. Send a request to get started.</p>
        )}
        {friends.map((p) => (
          <div className="flex flex-wrap items-center gap-4 py-4" key={p.uid}>
            <UserAvatar user={profileView(p)} />
            <span className="flex-1">
              {p.displayName}
              <small className="block">@{p.username}</small>
            </span>
            <button
              disabled={busy}
              className="button secondary"
              onClick={() => void show(p)}
            >
              View profile
            </button>
            <button
              disabled={busy}
              className="button secondary"
              onClick={() =>
                void act(async () => {
                  generation.current++;
                  setPreview(null);
                  for (const r of requests.filter(
                    (r) => r.status === "accepted" && r.members.includes(p.uid),
                  ))
                    await removeFriendOrRequest(r.id);
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </section>
      {preview && friendIds.includes(preview.profile.uid) && (
        <section className="mb-6">
          <ProfileCard
            user={profileView(preview.profile, preview.activity)}
            endDate={todayUTC()}
          />
        </section>
      )}
      <h2 className="mb-4">Weekly challenges</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            id: "workouts",
            name: "Complete 3 workouts",
            value: stats.weekly.workouts,
            target: 3,
          },
          {
            id: "distance",
            name: "Run 5 km",
            value: stats.weekly.runKm,
            target: 5,
          },
          {
            id: "reps",
            name: "Complete 500 reps",
            value: stats.weekly.reps,
            target: 500,
          },
        ].map((c) => (
          <article key={c.name} className="panel">
            <h3>{c.name}</h3>
            <button
              disabled={busy}
              className="button secondary mt-4"
              onClick={() =>
                void act(() =>
                  saveChallenges(
                    uid,
                    joined.includes(c.id)
                      ? joined.filter((id) => id !== c.id)
                      : [...joined, c.id],
                  ),
                )
              }
            >
              {joined.includes(c.id) ? "Leave challenge" : "Join challenge"}
            </button>
            <p className="my-4">
              {c.value} / {c.target}
            </p>
            <progress
              className="w-full accent-[#ccf66b]"
              value={Math.min(c.value, c.target)}
              max={c.target}
              aria-label={c.name}
            />
            <Link href="/dashboard" className="button secondary mt-4">
              Keep training
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
