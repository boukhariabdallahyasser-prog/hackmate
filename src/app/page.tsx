import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Code2,
  Globe,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, eventDate, listEvents } from "@/lib/events";

const categoriesToShow = [
  { category: "hackathon", label: "Hackathons", icon: Trophy },
  { category: "coding", label: "Coding competitions", icon: Code2 },
  { category: "workshop", label: "Workshops", icon: CalendarDays },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await listEvents({
    search: "",
    latestFirst: false,
    page: 1,
    upcomingOnly: true,
  });
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <p className="eyebrow">
              <Globe size={15} aria-hidden="true" /> Algeria’s student tech
              community
            </p>
            <h1>
              Find your next <em>hackathon.</em>
            </h1>
            <p className="hero-copy">
              Find events across Algeria, meet teammates from other campuses,
              and build something together.
            </p>
            <div className="home-actions">
              <Button asChild>
                <Link href="/events?upcoming=1">
                  Explore upcoming events{" "}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Link className="home-join" href="/auth/register">
                Create a student account
              </Link>
            </div>
          </div>
          <section className="home-agenda" aria-labelledby="home-agenda-title">
            <header>
              <CalendarDays size={20} aria-hidden="true" />
              <h2 id="home-agenda-title">Coming up</h2>
            </header>
            {events.ok && events.events.length ? (
              <ul>
                {events.events.slice(0, 3).map((event) => (
                  <li key={event.id}>
                    <Link
                      className="home-agenda-item"
                      href={`/events/${event.slug}`}
                    >
                      <div>
                        <p>
                          {Object.hasOwn(categories, event.category)
                            ? categories[
                                event.category as keyof typeof categories
                              ]
                            : "Student tech event"}
                        </p>
                        <strong>{event.title}</strong>
                        <time dateTime={event.starts_at}>
                          {eventDate(event.starts_at)}
                        </time>
                      </div>
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-agenda-empty">
                {events.ok
                  ? "No upcoming events have been published yet."
                  : "Upcoming events are temporarily unavailable."}
              </p>
            )}
            <Link className="home-agenda-link" href="/events?upcoming=1">
              View the calendar <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </section>
      <section className="shell section">
        <div className="section-heading">
          <h2>Explore by category</h2>
          <Link href="/events">
            All events <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {categoriesToShow.map(({ category, label, icon: Icon }) => (
            <Link
              className="category"
              key={category}
              href={`/events?category=${category}`}
            >
              <Icon aria-hidden="true" size={25} />
              <span>{label}</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
