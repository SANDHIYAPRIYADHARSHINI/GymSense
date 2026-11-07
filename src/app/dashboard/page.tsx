"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  Play,
  SlidersHorizontal,
  Timer,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { profileView, todayUTC } from "@/lib/firestore/streaks";
import { profileStats } from "@/lib/social";
import { workoutPlans } from "@/data/workoutPlans";
import { exercises } from "@/data/exercises";
import { getDay, emptyProgress } from "@/lib/workoutProgress";
import { workoutGoals } from "@/data/userProgress";
const goalIcons = {
  strength: Dumbbell,
  flame: Flame,
  custom: SlidersHorizontal,
};
export default function DashboardPage() {
  const { profile, progress } = useAuth();
  if (!profile) return null;
  const summary = profileStats(
    profileView(profile, Object.values(progress.activity)),
    todayUTC(),
  );
  const user = { firstName: profile.displayName.split(" ")[0] };
  const weeklyStats = {
    workoutsCompleted: summary.weekly.workouts,
    activeMinutes: summary.weekly.activeMinutes,
    repsCompleted: summary.weekly.reps,
    currentStreak: summary.currentStreak,
    periodLabel: "This week (UTC)",
  };
  const currentPlan = workoutPlans.find(
    (p) => p.id === progress.currentPlanGoal,
  )!;
  const planProgress =
    progress.plans[progress.currentPlanGoal] ?? emptyProgress();
  const nextDay = currentPlan.days.find(
    (d) => !planProgress.completedDays.includes(d.day),
  );
  const routine = nextDay
    ? getDay(currentPlan, planProgress, nextDay.day)
    : null;
  const nextExercise = routine?.exercises.find(
    (e) =>
      !planProgress.completedExercises[routine.day]?.includes(e.exerciseId),
  );
  const exercise = exercises.find((e) => e.id === nextExercise?.exerciseId);
  const lastWorkout =
    exercise && routine
      ? {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          planName: currentPlan.title,
          day: routine.day,
          completedExercises:
            planProgress.completedExercises[routine.day]?.length ?? 0,
          totalExercises: routine.exercises.length,
          remainingMinutes: currentPlan.days[routine.day - 1].estimatedMinutes,
        }
      : null;
  const cards = [
    ...workoutGoals.map((goal) => ({
      ...goal,
      href: `/plan/${goal.id}`,
      Icon: goalIcons[goal.icon as keyof typeof goalIcons],
      cta: "Start Plan",
      badge: "3-Day Plan",
    })),
    {
      id: "run",
      title: "Run / Treadmill",
      subtitle: "Find your stride outdoors or set your treadmill pace.",
      tag: "GO THE DISTANCE",
      href: "/run",
      Icon: Footprints,
      cta: "Start Run",
      badge: "At your pace",
    },
  ];
  const stats = [
    {
      label: "Workouts completed",
      value: weeklyStats.workoutsCompleted,
      unit: "sessions",
      Icon: Dumbbell,
    },
    {
      label: "Active minutes",
      value: weeklyStats.activeMinutes,
      unit: "minutes",
      Icon: Timer,
    },
    {
      label: "Reps completed",
      value: weeklyStats.repsCompleted,
      unit: "reps",
      Icon: Zap,
    },
    {
      label: "Current streak",
      value: weeklyStats.currentStreak,
      unit: "days",
      Icon: Flame,
    },
  ];
  return (
    <div className="space-y-8 md:space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow">
            <span /> YOUR DAILY MOMENTUM
          </p>
          <h1>Welcome back, {user.firstName}.</h1>
          <p className="mt-3 max-w-xl text-sm">
            A fresh session. Another step forward. What are we working on today?
          </p>
        </div>
        <Link
          href="/profile"
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#ccf66b]/25 bg-[#ccf66b]/5 px-5 py-3 hover:bg-[#ccf66b]/10"
          aria-label={`View your ${weeklyStats.currentStreak}-day streak on your profile`}
        >
          <Flame className="lime" size={25} aria-hidden="true" />
          <div>
            <strong className="block text-lg">
              {weeklyStats.currentStreak}-day streak
            </strong>
            <span className="text-xs text-[#a7b29d]">
              Keep your momentum going
            </span>
          </div>
        </Link>
      </header>
      <section aria-labelledby="goals-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">CHOOSE YOUR DIRECTION</p>
            <h2 id="goals-heading">Your goal. Your next move.</h2>
          </div>
          <Link
            href="/exercises"
            className="inline-flex min-h-11 items-center gap-2 text-xs text-[#ccf66b]"
          >
            Browse exercise library <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-5">
          {cards.map(({ id, title, subtitle, tag, href, Icon, cta, badge }) => (
            <Link
              href={href}
              key={id}
              className="group flex min-h-64 flex-col rounded-2xl border border-[#36412d] bg-linear-to-br from-[#283320] to-[#171c16] p-6 transition hover:-translate-y-1 hover:border-[#ccf66b]/70 hover:shadow-lg hover:shadow-black/20 motion-reduce:transform-none md:p-7"
            >
              <div className="mb-6 flex items-start justify-between">
                <span className="icon-box">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span className="pill">{badge}</span>
              </div>
              <span className="card-tag">{tag}</span>
              <h3 className="text-2xl md:text-3xl">{title}</h3>
              <p className="mt-2 mb-6 text-sm">{subtitle}</p>
              <span className="mt-auto flex min-h-11 items-center justify-between border-t border-white/10 pt-4 text-sm font-bold text-[#ccf66b]">
                {cta}
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      {lastWorkout ? (
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="mb-5">
            Continue where you left off
          </h2>
          <Link
            href={`/workout/${lastWorkout.exerciseId}`}
            className="group flex flex-wrap items-center gap-5 rounded-2xl border border-[#53643d] bg-linear-to-r from-[#303e23] to-[#1b2317] p-6 hover:border-[#ccf66b] md:p-7"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#ccf66b] text-[#1e2911]">
              <Play size={25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <span className="card-tag">
                {lastWorkout.planName} / DAY {lastWorkout.day}
              </span>
              <h3 className="text-xl">{lastWorkout.exerciseName}</h3>
              <p className="mt-1 text-xs">
                {lastWorkout.completedExercises} of {lastWorkout.totalExercises}{" "}
                exercises completed &middot; {lastWorkout.remainingMinutes} min
                remaining
              </p>
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/30"
                role="progressbar"
                aria-label="Workout completion"
                aria-valuenow={lastWorkout.completedExercises}
                aria-valuemin={0}
                aria-valuemax={lastWorkout.totalExercises}
              >
                <div
                  className="h-full rounded-full bg-[#ccf66b]"
                  style={{
                    width: `${(lastWorkout.completedExercises / lastWorkout.totalExercises) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="flex min-h-11 items-center gap-3 text-sm font-bold text-[#ccf66b]">
              Resume workout <ChevronRight size={19} aria-hidden="true" />
            </span>
          </Link>
        </section>
      ) : (
        <p className="panel">
          Choose a goal to begin, or return to your plan to finish a day.
        </p>
      )}
      <section aria-labelledby="weekly-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="weekly-heading">Your week in motion</h2>
          <span className="text-xs text-[#929a8c]">
            {weeklyStats.periodLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, unit, Icon }) => (
            <Link
              href="/profile"
              key={label}
              className="flex min-h-44 flex-col items-start rounded-2xl border border-[#2b3029] bg-[#191e17] p-4 hover:border-[#91ac68] md:p-5"
              aria-label={`${label}: ${value} ${unit}. View profile.`}
            >
              <Icon className="lime mb-4" size={20} aria-hidden="true" />
              <div>
                <strong className="text-3xl font-bold tracking-tight">
                  {value}
                </strong>
                <span className="ml-2 text-xs text-[#929a8c]">{unit}</span>
              </div>
              <span className="mt-2 text-xs text-[#b7c1ac]">{label}</span>
            </Link>
          ))}
        </div>
      </section>
      <p className="text-xs text-[#929a8c]">
        Stats update from your saved workouts, exercise logs and runs.
      </p>
    </div>
  );
}
