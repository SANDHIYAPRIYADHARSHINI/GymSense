import { emptyWorkoutProgress } from "./types";
import { writeProgress } from "./workouts";
import {
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseClient, requireOnline } from "../firebase";
import type { Goal, PublicProfile, UserProfile } from "./types";
export function normalizeUsername(value: string) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username))
    throw new Error(
      "Username must be 3–24 lowercase letters, numbers, or underscores.",
    );
  return username;
}
export async function createProfile(
  user: User,
  input: { username: string; displayName: string; goal: Goal },
) {
  requireOnline();
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  if (!displayName || displayName.length > 80)
    throw new Error("Enter a name between 1 and 80 characters.");
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", user.uid),
      nameRef = doc(db, "usernames", username);
    const [existing, claim] = await Promise.all([
      tx.get(userRef),
      tx.get(nameRef),
    ]);
    if (existing.exists()) return;
    if (claim.exists())
      throw new Error(
        "That username is taken. Choose another; your sign-in account is already created.",
      );
    const publicProfile: PublicProfile = {
      uid: user.uid,
      username,
      displayName,
      photoURL: null,
      goal: input.goal,
    };
    writeProgress(tx, db, user.uid, {
      ...emptyWorkoutProgress(),
      currentPlanGoal: input.goal,
    });
    tx.set(nameRef, { uid: user.uid });
    tx.set(userRef, {
      ...publicProfile,
      email: user.email ?? "",
      fitnessLevel: "beginner",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(doc(db, "publicProfiles", user.uid), publicProfile);
  });
}
export async function getUser(uid: string) {
  const snap = await getDoc(doc(firebaseClient().db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
export async function updateUser(
  uid: string,
  changes: Pick<UserProfile, "displayName" | "goal" | "fitnessLevel">,
) {
  requireOnline();
  const { db } = firebaseClient();
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "publicProfiles", uid), {
    displayName: changes.displayName,
    goal: changes.goal,
  });
  await batch.commit();
}
export async function searchUsers(prefix: string): Promise<PublicProfile[]> {
  const text = prefix.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{1,24}$/.test(text)) return [];
  const snap = await getDocs(
    query(
      collection(firebaseClient().db, "publicProfiles"),
      where("username", ">=", text),
      where("username", "<=", text + "\uf8ff"),
      limit(20),
    ),
  );
  return snap.docs.map((d) => d.data() as PublicProfile);
}
export async function getPublicProfile(uid: string) {
  const snap = await getDoc(doc(firebaseClient().db, "publicProfiles", uid));
  return snap.exists() ? (snap.data() as PublicProfile) : null;
}
