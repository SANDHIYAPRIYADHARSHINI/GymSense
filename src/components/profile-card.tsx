import Link from "next/link";
import { Dumbbell, Flame, Timer, Trophy, Zap } from "lucide-react";
import type { MockUser } from "@/data/users";
import { profileStats } from "@/lib/social";
import { ContributionGraph } from "./contribution-graph";
export function UserAvatar({
  user,
  large = false,
}: {
  user: MockUser;
  large?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Avatar for ${user.name}`}
      className={`flex shrink-0 items-center justify-center rounded-2xl border font-bold ${large ? "size-20 text-2xl" : "size-12 text-base"}`}
      style={{
        background: `${user.color}18`,
        color: user.color,
        borderColor: `${user.color}40`,
      }}
    >
      {user.initials}
    </div>
  );
}
export function ProfileCard({
  user,
  action,
  endDate,
}: {
  user: MockUser;
  action?: React.ReactNode;
  endDate?: string;
}) {
  const stats = profileStats(user, endDate);
  const metrics = [
    {
      label: "Current streak",
      value: stats.currentStreak,
      unit: "days",
      Icon: Flame,
    },
    {
      label: "Longest streak",
      value: stats.longestStreak,
      unit: "days",
      Icon: Trophy,
    },
    {
      label: "Weekly workouts",
      value: stats.weekly.workouts,
      unit: "this week",
      Icon: Dumbbell,
    },
    { label: "Total reps", value: stats.totalReps, unit: "reps", Icon: Zap },
    {
      label: "Total active minutes",
      value: stats.totalActiveMinutes,
      unit: "minutes",
      Icon: Timer,
    },
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#3a4b2e] bg-linear-to-br from-[#29371f] to-[#192015] p-5 sm:p-7">
        <UserAvatar user={user} large />
        <div className="min-w-0 flex-1 basis-44">
          <h2 className="text-2xl">{user.name}</h2>
          <p className="mt-1 text-sm text-[#ccf66b]">@{user.username}</p>
          <p className="mt-3 text-xs">
            <span className="text-[#d2e3c1]">Goal: </span>
            <Link
              className="underline decoration-[#647a50] underline-offset-4 hover:text-[#ccf66b]"
              href={`/plan/${user.goalId}`}
            >
              {user.goal}
            </Link>
          </p>
        </div>
        {action}
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map(({ label, value, unit, Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[#33432a] bg-[#192114] p-4"
          >
            <dt className="flex min-h-8 items-center gap-2 text-[10px] text-[#b9cda7]">
              <Icon size={15} className="shrink-0" />
              {label}
            </dt>
            <dd className="mt-3 text-2xl font-bold text-[#edfae2]">
              {value.toLocaleString("en")}
              <span className="mt-1 block text-[10px] font-normal text-[#9fb18e]">
                {unit}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <ContributionGraph
        key={user.id}
        activity={user.activity}
        endDate={endDate}
        username={user.username}
      />
      <p className="text-[10px]">
        Stats use saved activity history. An active workout, rep session, or run
        contributes to a streak; an unfinished today keeps yesterday’s streak
        until the day ends.
      </p>
    </div>
  );
}
