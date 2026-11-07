"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Dumbbell, Maximize2, Pause, Play, X, Youtube } from "lucide-react";
import type { Exercise } from "@/data/exercises";
import { resolveDemoAsset } from "@/data/animationAssets";
import { DEMO_OPEN_EVENT } from "@/lib/demo";
function YouTubeButton({ exercise }: { exercise: Exercise }) {
  return (
    <a
      href={exercise.youtubeVideo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="button secondary"
      title={
        exercise.youtubeVideo.title +
        " ? " +
        exercise.youtubeVideo.channel +
        " (opens in a new tab)"
      }
      onClick={() => window.dispatchEvent(new Event(DEMO_OPEN_EVENT))}
    >
      <Youtube size={18} aria-hidden="true" /> YouTube
    </a>
  );
}
function DemoVisual({
  exercise,
  paused,
}: {
  exercise: Exercise;
  paused: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const asset = resolveDemoAsset(exercise.id, exercise.animationPath);
  if (!asset || failed)
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#425535] bg-[#11180e] p-8 text-center">
        <Dumbbell size={37} className="lime" aria-hidden="true" />
        <span className="font-bold">Demo coming soon</span>
        <p className="max-w-sm text-xs">
          Follow the numbered instructions for {exercise.name.toLowerCase()}{" "}
          below.
        </p>
      </div>
    );
  return (
    <div className="flex items-center justify-center rounded-xl bg-[#11180e]">
      <Image
        src={paused ? asset.posterPath : asset.animationPath}
        alt={`${exercise.name}: ${paused ? "paused stickman pose" : "looping stickman demonstration"}`}
        width={320}
        height={240}
        unoptimized
        className="h-auto w-full max-w-xl"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
export function ExerciseDemo({
  exercise,
  triggerOnly = false,
}: {
  exercise: Exercise;
  triggerOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const hasDemo = !!resolveDemoAsset(exercise.id, exercise.animationPath);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    if (!element) return;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    close.current?.focus();
    window.dispatchEvent(new Event(DEMO_OPEN_EVENT));
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
  const watchButton = (
    <button
      ref={trigger}
      type="button"
      className={
        triggerOnly
          ? "inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#ccf66b] hover:text-[#e4ffbb]"
          : "button primary"
      }
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      <Maximize2 size={16} aria-hidden="true" />
      Watch demo
    </button>
  );
  const pauseButton = hasDemo ? (
    <button
      type="button"
      className="button secondary"
      onClick={() => setPaused((value) => !value)}
      aria-pressed={paused}
    >
      {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
      {paused ? "Play animation" : "Pause animation"}
    </button>
  ) : null;
  return (
    <>
      {triggerOnly ? (
        <div className="flex flex-wrap items-center gap-3">
          {watchButton}
          <YouTubeButton exercise={exercise} />
        </div>
      ) : (
        <section
          className="panel"
          aria-label={`${exercise.name} movement demonstration`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2>Movement demo</h2>
            <span className="pill">
              {hasDemo ? "STICKMAN GUIDE" : "WRITTEN GUIDE"}
            </span>
          </div>
          <DemoVisual
            key={exercise.id}
            exercise={exercise}
            paused={paused || open}
          />
          <p className="mt-4 text-xs">
            {hasDemo
              ? "Watch the movement, then follow the numbered instructions. The animation is a simplified guide."
              : "This exercise has a written guide while its animation is being prepared."}
          </p>
          <p className="mt-2 text-xs text-[#a9ba9a]">
            YouTube tutorial by {exercise.youtubeVideo.channel}. Opens in a new
            tab.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {watchButton}
            {pauseButton}
            <YouTubeButton exercise={exercise} />
          </div>
        </section>
      )}
      <dialog
        ref={dialog}
        className="demo-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      >
        {open && (
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-7">
            <header className="sticky top-0 z-10 mb-6 flex items-start justify-between gap-5 bg-[#0e150b]/95 py-2 backdrop-blur">
              <div>
                <p className="eyebrow">LEARN THE MOVEMENT</p>
                <h2 id={titleId} className="text-2xl sm:text-3xl">
                  {exercise.name}
                </h2>
                <p id={descriptionId} className="mt-2 text-xs">
                  {exercise.targetMuscles.join(" / ")} &middot;{" "}
                  {exercise.equipment.join(", ")}
                </p>
              </div>
              <button
                ref={close}
                type="button"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#4a5a3b] bg-[#212b19] hover:bg-[#334326]"
                aria-label="Close exercise demonstration"
                onClick={() => setOpen(false)}
              >
                <X size={23} />
              </button>
            </header>
            <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <DemoVisual
                  key={exercise.id}
                  exercise={exercise}
                  paused={paused}
                />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  {pauseButton}
                  <YouTubeButton exercise={exercise} />
                  <span className="text-xs text-[#a9ba9a]">
                    {hasDemo
                      ? "Looping guide / reduced motion supported"
                      : "Animation unavailable / follow the steps"}
                  </span>
                </div>
              </div>
              <section className="rounded-2xl border border-[#36482b] bg-[#192214] p-6 sm:p-7">
                <h3 className="text-xl">How to do it</h3>
                <ol className="instruction-list list-decimal">
                  {exercise.instructions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <h3 className="mb-3 text-base">Keep in mind</h3>
                <ul className="list-disc space-y-3 pl-5 text-xs text-[#bccbb0]">
                  {exercise.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </section>
            </div>
            <p className="mt-6 text-xs text-[#9cac8e]">
              Review the movement before starting your camera. Press Escape or
              the close button to return.
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
