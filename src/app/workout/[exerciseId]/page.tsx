import { notFound } from "next/navigation";
import { Workout } from "@/components/features";
import { exerciseLibrary } from "@/data/workoutPlans";
export function generateStaticParams() {
  return exerciseLibrary.map((exercise) => ({ exerciseId: exercise.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const exercise = exerciseLibrary.find((item) => item.id === exerciseId);
  if (!exercise) notFound();
  return <Workout exercise={exercise} />;
}
