import { notFound } from "next/navigation";
import { WorkoutPlanView } from "@/components/workout-plan";
import {
  findWorkoutPlan,
  planAliases,
  workoutPlans,
} from "@/data/workoutPlans";
export function generateStaticParams() {
  return [
    ...workoutPlans.map((plan) => plan.id),
    ...Object.keys(planAliases),
  ].map((goal) => ({ goal }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ goal: string }>;
}) {
  const { goal } = await params;
  const plan = findWorkoutPlan(goal);
  if (!plan) notFound();
  return <WorkoutPlanView key={plan.id} plan={plan} />;
}
