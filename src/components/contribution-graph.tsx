"use client";
import { useMemo, useRef, useState } from "react";
import { MOCK_TODAY, shiftDate, type UserActivity } from "@/data/users";
import {
  activitySummary,
  contributionDays,
  displayDate,
  type Intensity,
} from "@/lib/social";
const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});
const weekdayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  timeZone: "UTC",
});
const colors: Record<Intensity, string> = {
  none: "bg-[#263020]",
  light: "bg-[#4a6834]",
  moderate: "bg-[#89b44d]",
  strong: "bg-[#ccf66b]",
};
export function ContributionGraph({
  activity,
  username,
  endDate = MOCK_TODAY,
}: {
  activity: UserActivity[];
  username: string;
  endDate?: string;
}) {
  const days = useMemo(
    () => contributionDays(activity, endDate),
    [activity, endDate],
  );
  const [selectedDate, setSelectedDate] = useState(endDate);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = days.find((day) => day.date === selectedDate) ?? days[83];
  const first = days[0].date;
  function move(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    switch (event.key) {
      case "ArrowUp":
        next = index - 1;
        break;
      case "ArrowDown":
        next = index + 1;
        break;
      case "ArrowLeft":
        next = index - 7;
        break;
      case "ArrowRight":
        next = index + 7;
        break;
      case "Home":
        next = event.ctrlKey ? 0 : Math.floor(index / 7) * 7;
        break;
      case "End":
        next = event.ctrlKey ? 83 : Math.floor(index / 7) * 7 + 6;
        break;
      default:
        return;
    }
    event.preventDefault();
    next = Math.min(83, Math.max(0, next));
    setSelectedDate(days[next].date);
    buttons.current[next]?.focus();
  }
  return (
    <section
      className="rounded-2xl border border-[#34422b] bg-[#171e13] p-4 sm:p-6"
      aria-label={`${username}'s contribution graph`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">CONSISTENCY IN COLOR</p>
          <h2>Last 12 weeks</h2>
        </div>
        <span className="text-[10px] text-[#a9b99b]">
          {displayDate(first)} – {displayDate(endDate)}
        </span>
      </div>
      <div className="max-w-xl">
        <div className="mb-2 ml-8 grid grid-cols-3 text-[10px] text-[#a5b09b]">
          {[0, 28, 56].map((offset) => (
            <span key={offset}>
              {monthFormatter.format(
                new Date(shiftDate(first, offset) + "T00:00:00Z"),
              )}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
          <div className="grid grid-rows-7 text-[9px] text-[#8c9f7b]">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="flex items-center">
                {weekdayFormatter.format(
                  new Date(shiftDate(first, index) + "T00:00:00Z"),
                )}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col grid-cols-12 grid-rows-7 gap-1"
            role="group"
            aria-label="Daily activity. Use arrow keys to explore."
          >
            {days.map((day, index) => (
              <button
                key={day.date}
                type="button"
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                tabIndex={day.date === selected.date ? 0 : -1}
                aria-label={`${displayDate(day.date)}: ${activitySummary(day)}. ${day.intensity} intensity.`}
                aria-pressed={day.date === selected.date}
                title={`${displayDate(day.date)}: ${activitySummary(day)}`}
                className={`contribution-day aspect-square w-full min-w-0 rounded-[3px] border border-white/5 hover:brightness-125 ${colors[day.intensity]} ${day.date === selected.date ? "ring-1 ring-white ring-offset-1 ring-offset-[#171e13]" : ""}`}
                onMouseEnter={() => setSelectedDate(day.date)}
                onFocus={() => setSelectedDate(day.date)}
                onClick={() => setSelectedDate(day.date)}
                onKeyDown={(event) => move(event, index)}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-[9px] text-[#acbd9c]">
          {(["none", "light", "moderate", "strong"] as const).map((level) => (
            <span
              key={level}
              className="inline-flex items-center gap-1.5 capitalize"
            >
              <i
                className={`size-3 rounded-[2px] ${colors[level]}`}
                aria-hidden="true"
              />
              {level}
            </span>
          ))}
        </div>
      </div>
      <div
        className="mt-5 min-h-20 rounded-xl border border-[#35442b] bg-[#11180e] p-4"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <strong className="text-xs">{displayDate(selected.date)}</strong>
        <p className="mt-1 text-xs">{activitySummary(selected)}</p>
        <span className="mt-1 block text-[10px] capitalize text-[#b6cd9c]">
          {selected.intensity} activity
        </span>
      </div>
      <p className="mt-3 text-[10px]">
        Tap or hover a square for details. Arrow keys explore days and weeks.
        Each column contains seven consecutive days.
      </p>
    </section>
  );
}
