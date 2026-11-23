import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Code2,
  Compass,
  Search,
  Sparkles,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, eventDate, listEvents } from "@/lib/events";

const categoriesToShow = [
  {
    category: "hackathon",
    label: "Hackathons",
    description: "Pitch ideas. Ship real projects.",
    icon: Trophy,
    className: "category-purple",
  },
  {
    category: "coding",
    label: "Coding competitions",
    description: "Put your skills to the test.",
    icon: Code2,
    className: "category-blue",
  },
  {
    category: "workshop",
    label: "Workshops",
    description: "Learn something worth building.",
    icon: Sparkles,
    className: "category-peach",
  },
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
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="shell hero-grid">
          <div className="hero-main">
            <div className="eyebrow hero-eyebrow">
              <span className="status-dot" aria-hidden="true" />
              THE CAMPUS BUILDER NETWORK
            </div>
            <h1>
              Find your next <em>hackathon.</em>
              <span>Build what&apos;s next.</span>
            </h1>
            <p className="hero-copy">
              Discover opportunities worth showing up for, meet people who
              share your ambition, and turn a good idea into a great team.
            </p>
            <div className="home-actions">
              <Button asChild>
                <Link href="/events?upcoming=1">
                  Explore events <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Link className="hero-secondary" href="/community">
                Find your people <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <form action="/events" className="hero-search" role="search">
              <Search size={20} aria-hidden="true" />
              <label className="sr-only" htmlFor="home-search">
                Search student events
              </label>
              <input
                id="home-search"
                type="search"
                name="q"
                maxLength={100}
                placeholder="Try AI, hackathon, robotics…"
              />
              <button type="submit">
                Search <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
            <p className="hero-footnote">
              <Zap size={14} aria-hidden="true" /> Open event discovery. Student
              accounts unlock team features.
            </p>
          </div>
          <div className="hero-aside">
            <div className="hero-floating-label">
              <span className="floating-icon"><Compass size={17} aria-hidden="true" /></span>
              Your next move starts here
            </div>
            <section className="home-agenda" aria-labelledby="home-agenda-title">
              <header>
                <span className="agenda-icon"><CalendarDays size={19} aria-hidden="true" /></span>
                <div>
                  <p className="card-kicker">YOUR EVENT RADAR</p>
                  <h2 id="home-agenda-title">Coming up</h2>
                </div>
                <span className="agenda-live" aria-label="Upcoming events">Upcoming</span>
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
                          <p className="agenda-category">
                            {Object.hasOwn(categories, event.category)
                              ? categories[event.category as keyof typeof categories]
                              : "Student tech event"}
                          </p>
                          <strong>{event.title}</strong>
                          <time dateTime={event.starts_at}>
                            {eventDate(event.starts_at)}
                          </time>
                        </div>
                        <span className="agenda-arrow"><ArrowUpRight size={18} aria-hidden="true" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="home-agenda-empty">
                  <span className="empty-illustration"><CalendarDays size={26} aria-hidden="true" /></span>
                  <strong>{events.ok ? "The next event is waiting to land." : "Event radar is offline for now."}</strong>
                  <p>{events.ok ? "No upcoming events have been published yet. Explore the directory or check back soon." : "We couldn't load upcoming events. The directory may be temporarily unavailable."}</p>
                </div>
              )}
              <Link className="home-agenda-link" href="/events?upcoming=1">
                View the calendar <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </section>
            <div className="hero-bottom-note">
              <span className="note-avatars" aria-hidden="true"><i>H</i><i>M</i><i>+</i></span>
              Discover. Connect. Create.
            </div>
          </div>
        </div>
      </section>
      <section className="shell section explore-section">
        <div className="section-heading">
          <div>
            <p className="section-overline">EXPLORE YOUR WAY</p>
            <h2>Different interests. <span>One starting point.</span></h2>
            <p className="section-description">Skip the noise and find the kind of challenge that gets you excited to build.</p>
          </div>
          <Link href="/events" className="section-link">
            See all events <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {categoriesToShow.map(({ category, label, description, icon: Icon, className }) => (
            <Link
              className={`category ${className}`}
              key={category}
              href={`/events?category=${category}`}
              aria-label={label}
            >
              <span className="category-icon"><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="category-content">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <span className="category-arrow"><ArrowUpRight size={20} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="journey-section">
        <div className="shell journey-inner">
          <div className="journey-intro">
            <p className="section-overline">MORE THAN A LISTING SITE</p>
            <h2>Great things start with <span>the right connections.</span></h2>
            <p>HackMate makes the path from finding an opportunity to building with a team easier to navigate.</p>
            <Link href="/auth/register" className="journey-cta">Join the community <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="journey-steps">
            <Link className="journey-step" href="/events">
              <span className="step-number">01</span>
              <span className="step-symbol"><Compass size={24} aria-hidden="true" /></span>
              <span className="step-body"><strong>Discover an event</strong><small>Explore hackathons, competitions, and workshops from across Algeria.</small></span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link className="journey-step" href="/community">
              <span className="step-number">02</span>
              <span className="step-symbol"><UsersRound size={24} aria-hidden="true" /></span>
              <span className="step-body"><strong>Find your people</strong><small>Meet verified students and discover complementary skills.</small></span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link className="journey-step" href="/teams">
              <span className="step-number">03</span>
              <span className="step-symbol"><Code2 size={24} aria-hidden="true" /></span>
              <span className="step-body"><strong>Build together</strong><small>Form an event team, invite collaborators, and get moving.</small></span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <section className="shell cta-section">
        <div className="cta-band">
          <div>
            <p className="section-overline">YOUR NEXT CHAPTER</p>
            <h2>Don&apos;t just watch ideas happen. <span>Be part of one.</span></h2>
            <p>Browse freely. Join with your university email when you&apos;re ready to collaborate.</p>
          </div>
          <Link href="/auth/register" className="cta-band-link">
            Create an account <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
