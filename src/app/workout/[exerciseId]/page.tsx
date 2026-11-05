import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises, findExercise } from "@/data/exercises";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}): Promise<Metadata> {
  const { exerciseId } = await params;
  const exercise = findExercise(exerciseId);
  if (!exercise) notFound();
  return {
    title: exercise.name + " | GymSense",
    description: exercise.liveCounter
      ? "Local camera rep counting with guided form instructions."
      : "Exercise instructions and manual training logs.",
  };
}
export function generateStaticParams() {
  return exercises.map((exercise) => ({ exerciseId: exercise.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const exercise = findExercise(exerciseId);
  if (!exercise) notFound();
  return <ExerciseDetail key={exercise.id} exercise={exercise} />;
}
