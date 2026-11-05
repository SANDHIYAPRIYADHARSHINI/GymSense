import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel not-found">
      <p className="eyebrow">OFF THE BEATEN TRACK</p>
      <h1>Let�s get you moving again.</h1>
      <p>This page or workout doesn�t exist.</p>
      <Link className="button primary" href="/dashboard">
        Explore your plans
      </Link>
    </section>
  );
}
