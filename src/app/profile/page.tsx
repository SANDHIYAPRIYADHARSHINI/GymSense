import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { currentUser, MOCK_TODAY } from "@/data/users";
import { displayDate } from "@/lib/social";
import { PageHeading } from "@/components/landing";
import { ProfileCard } from "@/components/profile-card";
export default function Page() {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          eyebrow="EVERY DAY ADDS UP"
          title="Your effort has a story."
          description={`Your profile and training history, through ${displayDate(MOCK_TODAY)}.`}
        />
        <Link className="button secondary" href="/friends">
          Find your people <ArrowUpRight size={17} />
        </Link>
      </div>
      <ProfileCard user={currentUser} />
      <p className="mt-6 text-xs">
        Demo athlete profile. Streaks and totals are calculated from 24 weeks of
        sample daily activity.
      </p>
    </>
  );
}
