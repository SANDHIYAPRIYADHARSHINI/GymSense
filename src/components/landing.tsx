import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  Utensils,
  Dumbbell,
  Flame,
  Target,
  Timer,
  Zap,
  Check,
  MoveUpRight,
} from "lucide-react";
import { workoutGoals as goals } from "@/data/userProgress";
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">
        <span /> {eyebrow}
      </p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function GoalCards() {
  return (
    <div className="goal-grid">
      {goals.map((g, i) => (
        <Link
          href={`/plan/${g.id}`}
          className={`goal-card goal-${i}`}
          key={g.id}
        >
          <div className="goal-top">
            <span className="icon-box">
              {i === 0 ? (
                <Dumbbell />
              ) : i === 1 ? (
                <Flame />
              ) : (
                <SlidersHorizontal />
              )}
            </span>
            <ArrowUpRight size={20} />
          </div>
          <span className="card-tag">{g.tag}</span>
          <h3>{g.title}</h3>
          <p>{g.subtitle}</p>
          <div className="goal-bottom">
            <span>3-day starter plan</span>
            <ArrowRight size={17} />
          </div>
        </Link>
      ))}
    </div>
  );
}
export function Landing() {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">
            <span /> YOUR STRONGER STARTS HERE
          </p>
          <h1>
            Big goals. <span className="muted">Better you.</span>
          </h1>
          <p>Your next chapter starts with one good workout.</p>
        </div>
        <span className="date-chip">
          <Zap size={14} className="lime" aria-hidden="true" /> EVERY REP COUNTS
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">
            <Zap size={13} /> YOUR POTENTIAL. UNLOCKED.
          </span>
          <h2>
            Find your
            <br />
            <em>stronger.</em>
          </h2>
          <p>
            Smart workouts. Real progress. A fitness journey
            <br className="desktop-break" /> that moves with you, one rep at a
            time.
          </p>
          <Link className="button primary" href="/dashboard">
            Build my plan <ArrowUpRight size={18} />
          </Link>
          <div className="hero-proof">
            <span className="proof-avatars">
              <b>A</b>
              <b>J</b>
              <b>M</b>
            </span>
            <span>
              Built for every body.
              <br />
              <strong>Made for your ambition.</strong>
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-word">
            GO
            <br />
            ALL
            <br />
            IN.
          </span>
          <div className="barbell">
            <div className="bar" />
            <div className="weight weight-a" />
            <div className="weight weight-b" />
            <div className="weight weight-c" />
            <div className="weight weight-d" />
          </div>
          <div className="floating-chip">
            <span>
              <Flame size={19} />
            </span>
            <div>
              <b>One more rep.</b>
              <small>You&apos;ve got this.</small>
            </div>
            <Check size={15} />
          </div>
          <span className="art-cross">+</span>
        </div>
        <div className="hero-bottom">
          <span>
            <i /> TRAIN SMART. SHOW UP. LEVEL UP.
          </span>
          <span>
            01 / 03 <MoveUpRight size={15} />
          </span>
        </div>
      </section>
      <section className="stats-grid">
        {[
          {
            icon: Target,
            label: "YOUR GOAL",
            value: "A stronger you",
            note: "Choose your direction",
          },
          {
            icon: Dumbbell,
            label: "YOUR PLAN",
            value: "Built around you",
            note: "3 days. Endless potential.",
          },
          {
            icon: Timer,
            label: "YOUR PACE",
            value: "20–40 min",
            note: "Make time for yourself",
          },
          {
            icon: Flame,
            label: "YOUR MINDSET",
            value: "Progress > perfect",
            note: "Consistency is your superpower",
          },
        ].map(({ icon: Icon, label, value, note }) => (
          <div className="stat" key={label}>
            <Icon size={19} />
            <div>
              <span>{label}</span>
              <h3>{value}</h3>
              <p>{note}</p>
            </div>
          </div>
        ))}
      </section>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">A PLAN WITH PURPOSE</p>
            <h2>What are you working toward?</h2>
          </div>
          <Link href="/dashboard">
            Explore plans <ArrowRight size={16} />
          </Link>
        </div>
        <GoalCards />
      </section>
      <section className="bottom-grid">
        <div className="daily-card">
          <span className="icon-box">
            <Zap />
          </span>
          <div>
            <span className="card-tag">THE DAILY REMINDER</span>
            <h3>
              You don&apos;t have to be extreme.
              <br />
              Just consistent.
            </h3>
            <p>Show up for yourself. The results will follow.</p>
          </div>
        </div>
        <Link href="/diet" className="nutrition-card">
          <div>
            <span className="card-tag">FUEL YOUR PROGRESS</span>
            <h3>
              Good training.
              <br />
              Better nutrition.
            </h3>
            <span>
              Find your fuel <ArrowRight size={16} />
            </span>
          </div>
          <span className="food-art" aria-hidden="true">
            <Utensils size={76} strokeWidth={1.4} />
          </span>
        </Link>
      </section>
    </>
  );
}
