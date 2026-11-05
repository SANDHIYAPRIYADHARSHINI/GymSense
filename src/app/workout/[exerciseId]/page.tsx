import { notFound } from "next/navigation";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises, findExercise } from "@/data/exercises";
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
