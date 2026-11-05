import { notFound } from "next/navigation";
import { Workout } from "@/components/features";
import { exercises } from "@/data/mock";
export function generateStaticParams() {
  return exercises.map((e) => ({ exerciseId: e.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) notFound();
  return <Workout exercise={exercise} />;
}
