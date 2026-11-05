import { notFound } from "next/navigation";
import { Plan } from "@/components/features";
import { goals } from "@/data/mock";
export function generateStaticParams() {
  return goals.map((g) => ({ goal: g.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ goal: string }>;
}) {
  const { goal } = await params;
  const item = goals.find((g) => g.id === goal);
  if (!item) notFound();
  return <Plan title={item.title} goal={goal} />;
}
