import {
  isDemoSession,
  demoSnapshot,
  watchDemo,
  sendDemoRequest,
  respondDemoRequest,
  removeDemoRequest,
  demoFriendActivity,
  saveDemoChallenges,
} from "@/lib/demo/store";
import { validActivity } from "./streaks";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { firebaseClient, requireOnline } from "../firebase";
import type { FriendRequest } from "./types";
import type { UserActivity } from "@/data/users";
export function watchFriendRequests(
  uid: string,
  next: (requests: FriendRequest[]) => void,
  error: (e: Error) => void,
) {
  if (isDemoSession(uid))
    return watchDemo(() => next([...demoSnapshot().requests]));

  return onSnapshot(
    query(
      collection(firebaseClient().db, "friendRequests"),
      where("members", "array-contains", uid),
    ),
    (s) =>
      next(s.docs.map((d) => ({ ...d.data(), id: d.id }) as FriendRequest)),
    error,
  );
}
export const friendsFromRequests = (uid: string, requests: FriendRequest[]) => [
  ...new Set(
    requests
      .filter((r) => r.status === "accepted")
      .map((r) => (r.from === uid ? r.to : r.from)),
  ),
];
export async function sendFriendRequest(from: string, to: string) {
  if (isDemoSession(from)) return sendDemoRequest(to);

  requireOnline();
  if (from === to) throw new Error("You cannot add yourself.");
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "friendRequests", `${from}_${to}`),
      reverse = doc(db, "friendRequests", `${to}_${from}`);
    const [a, b] = await Promise.all([tx.get(ref), tx.get(reverse)]);
    if ([a, b].some((s) => s.exists() && s.data().status !== "rejected"))
      throw new Error("A request or friendship already exists.");
    tx.set(ref, {
      from,
      to,
      members: [from, to],
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function respondToFriendRequest(
  id: string,
  status: "accepted" | "rejected",
) {
  if (isDemoSession()) return respondDemoRequest(id, status);

  requireOnline();
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "friendRequests", id);
    const s = await tx.get(ref);
    if (!s.exists() || s.data().status !== "pending")
      throw new Error("This request is no longer pending.");
    tx.update(ref, { status, updatedAt: serverTimestamp() });
  });
}
export async function removeFriendOrRequest(id: string) {
  if (isDemoSession()) return removeDemoRequest(id);

  requireOnline();
  await deleteDoc(doc(firebaseClient().db, "friendRequests", id));
}
export async function getFriendActivity(uid: string): Promise<UserActivity[]> {
  if (isDemoSession()) return demoFriendActivity(uid);
  const s = await getDoc(doc(firebaseClient().db, "friendActivity", uid));
  return s.exists() ? validActivity(Object.values(s.data().activity)) : [];
}

export function watchChallenges(
  uid: string,
  next: (ids: string[]) => void,
  error: (e: Error) => void,
) {
  if (isDemoSession(uid))
    return watchDemo(() => next([...demoSnapshot().challenges]));

  return onSnapshot(
    doc(firebaseClient().db, "users", uid, "preferences", "challenges"),
    (s) => next(s.exists() ? s.data().joined : []),
    error,
  );
}
export async function saveChallenges(uid: string, joined: string[]) {
  if (isDemoSession(uid)) return saveDemoChallenges(joined);

  requireOnline();
  await setDoc(
    doc(firebaseClient().db, "users", uid, "preferences", "challenges"),
    { joined },
  );
}
