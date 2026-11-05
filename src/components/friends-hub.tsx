"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Plus,
  Search,
  Trophy,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { currentUser, MOCK_TODAY, users, weeklyChallenges } from "@/data/users";
import {
  defaultSocialState,
  displayDate,
  profileStats,
  restoreSocialState,
  searchUsers,
  SOCIAL_STORAGE_KEY,
  toggleChallenge,
  toggleFriend,
  weekStart,
  type SocialState,
} from "@/lib/social";
import { PageHeading } from "./landing";
import { ProfileCard, UserAvatar } from "./profile-card";
export function FriendsHub() {
  const [social, setSocial] = useState<SocialState>(defaultSocialState);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>("maya");
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState("");
  const preview = useRef<HTMLElement>(null);
  const previewTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        setSocial(
          restoreSocialState(
            localStorage.getItem(SOCIAL_STORAGE_KEY),
            currentUser.id,
          ),
        );
      } catch {
        setStorageError(
          "Browser storage is unavailable. Friend changes will last for this page visit only.",
        );
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  const friends = social.friendIds
    .map((id) => users.find((user) => user.id === id)!)
    .filter(Boolean);
  const matches = searchUsers(query, currentUser.id).filter(
    (user) => query.trim() || !social.friendIds.includes(user.id),
  );
  const selected = users.find((user) => user.id === previewId);
  const stats = profileStats(currentUser);
  function save(next: SocialState) {
    setSocial(next);
    try {
      localStorage.setItem(
        SOCIAL_STORAGE_KEY,
        JSON.stringify({ version: 1, ...next }),
      );
      setStorageError("");
    } catch {
      setStorageError(
        "Could not save social changes. They will be lost on refresh.",
      );
    }
  }
  function friendAction(id: string) {
    if (!ready) return;
    const isFriend = social.friendIds.includes(id);
    save(toggleFriend(social, id, currentUser.id));
    const user = users.find((item) => item.id === id)!;
    setMessage(
      `${isFriend ? "Removed" : "Added"} @${user.username} ${isFriend ? "from" : "to"} your friends.`,
    );
  }
  function showProfile(id: string) {
    setPreviewId(id);
    requestAnimationFrame(() => {
      preview.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      previewTitle.current?.focus({ preventScroll: true });
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE. YOUR MOMENTUM."
        title="A little stronger, together."
        description="Find a training friend, share a little motivation, and give your week a goal."
      />
      {storageError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-xs text-amber-100"
        >
          {storageError}
        </p>
      )}
      <section aria-labelledby="friend-list-heading" className="mb-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="friend-list-heading">
            Your friends{" "}
            <span className="text-[#93ab7c]">({friends.length})</span>
          </h2>
          <span className="pill">LOCAL DEMO</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {friends.map((user) => (
            <article
              key={user.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#3a492f] bg-[#1a2215] p-5"
            >
              <UserAvatar user={user} />
              <div className="min-w-0 flex-1 basis-32">
                <h3>{user.name}</h3>
                <p className="mt-1 text-xs">@{user.username}</p>
                <span className="mt-2 block text-[10px] text-[#c6dfac]">
                  {profileStats(user).currentStreak}-day streak
                </span>
              </div>
              <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => showProfile(user.id)}
                >
                  View profile
                </button>
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-2 px-2 text-xs text-[#b7c7a8] disabled:opacity-40"
                  disabled={!ready}
                  aria-label={`Remove @${user.username} from friends`}
                  onClick={() => friendAction(user.id)}
                >
                  <UserMinus size={17} />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        {!friends.length && (
          <div className="rounded-2xl border border-dashed border-[#465b34] p-7">
            <h3>Your circle starts here.</h3>
            <p className="mt-2 text-sm">
              Search for a username below and add a friend to your demo list.
            </p>
          </div>
        )}
      </section>
      <section aria-labelledby="search-heading" className="mb-9">
        <h2 id="search-heading">Find your training circle</h2>
        <label
          htmlFor="friend-search"
          className="mt-5 block text-xs text-[#bccdac]"
        >
          Search by username
        </label>
        <div className="relative mt-2">
          <Search
            className="absolute top-3.5 left-3 text-[#a5bd90]"
            size={18}
            aria-hidden="true"
          />
          <input
            id="friend-search"
            type="search"
            className="plan-input pl-10"
            style={{ paddingLeft: 40 }}
            placeholder="Try @mayamoves or jordan"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className="my-4 text-xs" role="status" aria-live="polite">
          {matches.length}{" "}
          {query.trim() ? "matching usernames" : "suggested friends"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((user) => {
            const added = social.friendIds.includes(user.id);
            return (
              <article
                key={user.id}
                className="rounded-xl border border-[#35462a] bg-[#192114] p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <UserAvatar user={user} />
                  <div className="min-w-0">
                    <h3 className="text-base">@{user.username}</h3>
                    <p className="mt-1 text-xs">{user.name}</p>
                  </div>
                </div>
                <p className="mb-4 text-xs">{user.goal}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`button ${added ? "secondary" : "primary"} disabled:opacity-40`}
                    disabled={!ready}
                    onClick={() => friendAction(user.id)}
                  >
                    {added ? <UserMinus size={16} /> : <UserPlus size={16} />}{" "}
                    {added ? "Remove friend" : "Add friend"}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 text-xs text-[#c4dda9]"
                    onClick={() => showProfile(user.id)}
                  >
                    View profile
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!matches.length && (
          <p className="rounded-xl border border-dashed border-[#465b34] p-5 text-sm">
            {query.trim()
              ? "No matching usernames. Try another search."
              : "Everyone in this demo is already in your circle."}
          </p>
        )}
        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-5 text-xs text-[#ccf66b]"
        >
          {message ||
            (!ready
              ? "Loading saved friends..."
              : "Friend changes stay on this browser. No invitations or notifications are sent.")}
        </p>
      </section>
      {selected && (
        <section
          ref={preview}
          aria-labelledby="friend-preview-heading"
          className="mb-9 scroll-mt-5"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 ref={previewTitle} tabIndex={-1} id="friend-preview-heading">
              Friend profile preview
            </h2>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#435635]"
              aria-label="Close friend profile preview"
              onClick={() => {
                setPreviewId(null);
                document.getElementById("friend-search")?.focus();
              }}
            >
              <X size={20} />
            </button>
          </div>
          <ProfileCard
            key={selected.id}
            user={selected}
            action={
              <button
                type="button"
                className={`button ${social.friendIds.includes(selected.id) ? "secondary" : "primary"} disabled:opacity-40`}
                disabled={!ready}
                onClick={() => friendAction(selected.id)}
              >
                {social.friendIds.includes(selected.id) ? (
                  <UserMinus size={17} />
                ) : (
                  <UserPlus size={17} />
                )}{" "}
                {social.friendIds.includes(selected.id)
                  ? "Remove friend"
                  : "Add friend"}
              </button>
            }
          />
        </section>
      )}
      <section aria-labelledby="challenges-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">MAKE THIS WEEK COUNT</p>
            <h2 id="challenges-heading">Weekly challenges</h2>
          </div>
          <span className="text-[10px] text-[#a6bb91]">
            Week starting {displayDate(weekStart())}
          </span>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {weeklyChallenges.map((challenge) => {
            const value = stats.weekly[challenge.metric];
            const complete = value >= challenge.target;
            const joined = social.joinedChallenges.includes(challenge.id);
            return (
              <article
                key={challenge.id}
                className="rounded-2xl border border-[#3f5330] bg-linear-to-br from-[#29381e] to-[#192114] p-5"
              >
                <Trophy className="lime mb-5" size={26} />
                <h3>{challenge.title}</h3>
                <p className="mt-2 text-xs">{challenge.description}</p>
                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-black/30"
                  role="progressbar"
                  aria-label={challenge.title}
                  aria-valuemin={0}
                  aria-valuemax={challenge.target}
                  aria-valuenow={Math.min(value, challenge.target)}
                >
                  <div
                    className="h-full rounded-full bg-[#ccf66b]"
                    style={{
                      width: `${Math.min(100, (value / challenge.target) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-[#cee5b6]">
                  {value} / {challenge.target} {challenge.unit}
                  {complete ? " — goal reached" : ""}
                </p>
                <button
                  type="button"
                  className="button secondary full mt-5 disabled:opacity-40"
                  disabled={!ready}
                  onClick={() => {
                    save(toggleChallenge(social, challenge.id));
                    setMessage(
                      `${joined ? "Left" : "Joined"} ${challenge.title.toLowerCase()}.`,
                    );
                  }}
                >
                  {joined ? <Check size={16} /> : <Plus size={16} />}{" "}
                  {joined ? "Joined — leave challenge" : "Join challenge"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <p className="mt-7 text-xs">
        All profiles and activity are mock data through{" "}
        {displayDate(MOCK_TODAY)}. Challenge progress comes from your own
        activity for this week and is independent of joining. Workout logs,
        runs, and social data are not synchronized with a backend.
      </p>
    </>
  );
}
