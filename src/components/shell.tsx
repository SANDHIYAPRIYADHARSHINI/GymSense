"use client";
import { useAuth, DemoBanner } from "./auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Dumbbell,
  Footprints,
  Home,
  LayoutGrid,
  Leaf,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Plans", icon: LayoutGrid },
  { href: "/run", label: "Run", icon: Footprints },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { profile } = useAuth();
  const initials =
    profile?.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("") ?? "GS";
  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          GymSense<span className="brand-dot">.</span>
        </Link>
        <p className="nav-caption">YOUR DAILY EDGE</p>
        <nav>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${(href === "/" ? path === href : path.startsWith(href) || (href === "/dashboard" && (path.startsWith("/plan") || path.startsWith("/workout")))) ? "active" : ""}`}
            >
              <Icon size={19} />
              {label}
              {label === "Plans" && <span className="tiny-tag">AI</span>}
            </Link>
          ))}
          <Link
            href="/exercises"
            className={`nav-link ${path === "/exercises" ? "active" : ""}`}
          >
            <BookOpen size={19} />
            Exercise library
          </Link>
          <Link
            href="/diet"
            className={`nav-link ${path === "/diet" ? "active" : ""}`}
          >
            <Leaf size={19} />
            Nutrition
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="coach-icon">
            <Zap size={20} />
          </div>
          <h3>
            A little better.
            <br />
            Every day.
          </h3>
          <p>
            Your only competition
            <br />
            is who you were yesterday.
          </p>
        </div>
        <div className="account">
          <div className="avatar">{initials}</div>
          <div>
            <b>{profile?.displayName ?? "GymSense"}</b>
            <small>Let us get stronger</small>
          </div>
          <Dumbbell size={17} />
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="top-label">BUILT FOR YOUR NEXT LEVEL</span>
          <Link href="/" className="mobile-brand">
            GymSense<span>.</span>
          </Link>
          <div className="top-right">
            <span className="demo-pill">
              <i /> GYMSENSE
            </span>
            <Link
              href="/profile"
              className="avatar small"
              aria-label="Open profile"
            >
              {initials}
            </Link>
          </div>
        </header>
        <main>
          <DemoBanner />
          {children}
        </main>
        <footer className="page-footer">
          <span>Make movement a mindset.</span>
          <span>GYMSENSE &copy; 2026</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "selected" : ""}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
