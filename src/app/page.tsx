import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, CalendarDays, Code2, Compass, Globe2,
  MapPin, Search, ShieldCheck, Sparkles, Trophy, UsersRound, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, eventDate, listEvents, sourceStatus } from "@/lib/events";

const categoryLinks = [
  { id: "hackathon", label: "Hackathons", description: "Build under pressure", icon: Trophy, className: "category-violet" },
  { id: "coding", label: "Coding competitions", description: "Put your skills to the test", icon: Code2, className: "category-blue" },
  { id: "workshop", label: "Workshops", description: "Learn something new", icon: Zap, className: "category-orange" },
  { id: "ai", label: "AI challenges", description: "Explore what's next", icon: Sparkles, className: "category-pink" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const results = await listEvents({
    search: "",
    latestFirst: false,
    page: 1,
    upcomingOnly: true,
  });
  const featured = results.ok ? results.events.slice(0, 3) : [];

  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-main">
            <div className="hero-kicker">
              <span className="pulse-dot" aria-hidden="true" />
              The home of student tech in Algeria
            </div>
            <h1>Find your next <em>hackathon.</em></h1>
            <p className="hero-copy">
              Your next big idea starts somewhere. Discover tech events,
              connect with ambitious students, and find your people.
            </p>
            <div className="home-actions">
              <Button asChild>
                <Link href="/events?upcoming=1">
                  Explore upcoming events <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Link className="hero-secondary" href="/auth/register">
                Join the community <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-trust">
              <span><Globe2 size={16} aria-hidden="true" /> Across Algeria</span>
              <span><ShieldCheck size={16} aria-hidden="true" /> University-focused</span>
              <span><UsersRound size={16} aria-hidden="true" /> Built for collaboration</span>
            </div>
          </div>
          <section className="home-agenda" aria-labelledby="home-agenda-title">
            <header>
              <div>
                <span className="panel-kicker">YOUR NEXT OPPORTUNITY</span>
                <h2 id="home-agenda-title">Coming up <span className="agenda-star" aria-hidden="true">✳</span></h2>
              </div>
              <span className="agenda-icon"><CalendarDays size={19} aria-hidden="true" /></span>
            </header>
            {featured.length ? (
              <ul>
                {featured.map((event) => (
                  <li key={event.id}>
                    <Link className="home-agenda-item" href={`/events/${event.slug}`}>
                      <span className="agenda-date">
                        <CalendarDays size={16} aria-hidden="true" />
                        {eventDate(event.starts_at)}
                      </span>
                      <strong>{event.title}</strong>
                      <span className="agenda-bottom">
                        <span>{Object.hasOwn(categories, event.category)
                          ? categories[event.category as keyof typeof categories]
                          : "Tech event"}</span>
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="agenda-empty">
                <span className="agenda-empty-symbol"><Compass size={26} aria-hidden="true" /></span>
                <strong>Great things are on the horizon.</strong>
                <p>{results.ok
                  ? "No upcoming events have been published yet. Explore all events while we get things rolling."
                  : "Upcoming events are temporarily unavailable. You can still explore the event directory."}</p>
              </div>
            )}
            <Link className="home-agenda-link" href="/events?upcoming=1">
              View the calendar <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </div>
        <div className="hero-glow" aria-hidden="true" />
      </section>

      <section className="shell home-discover" aria-labelledby="discover-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FIND YOUR THING</span>
            <h2 id="discover-title">Whatever you&apos;re into, <span>there&apos;s a place for you.</span></h2>
          </div>
          <Link href="/events" className="section-link">All events <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="category-grid">
          {categoryLinks.map(({ id, label, description, icon: Icon, className }) => (
            <Link className={`category ${className}`} key={id} href={`/events?category=${id}`}>
              <span className="category-symbol"><Icon size={25} strokeWidth={1.9} aria-hidden="true" /></span>
              <span className="category-name">{label}</span>
              <span className="category-description">{description}</span>
              <ArrowUpRight className="category-arrow" size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-featured">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="section-kicker">DON&apos;T MISS OUT</span>
              <h2>Opportunities worth <span>showing up for.</span></h2>
            </div>
            <Link className="section-link" href="/events?upcoming=1">Browse events <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          {featured.length ? (
            <div className="featured-grid">
              {featured.map((event) => (
                <Link key={event.id} className="featured-card" href={`/events/${event.slug}`}>
                  <span className="featured-card-top"><span>{sourceStatus(event.source_status)}</span><ArrowUpRight size={19} aria-hidden="true" /></span>
                  <span className="featured-card-category">{categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
                  <strong>{event.title}</strong>
                  <span className="featured-card-bottom">
                    <span><CalendarDays size={15} aria-hidden="true" /> {eventDate(event.starts_at)}</span>
                    <span><MapPin size={15} aria-hidden="true" /> {event.location || event.format}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="featured-empty">
              <span><Search size={24} aria-hidden="true" /></span>
              <div>
                <strong>No upcoming events published yet.</strong>
                <p>New opportunities will appear here once they are approved.</p>
              </div>
              <Link href="/events">Explore all events <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          )}
        </div>
      </section>

      <section className="shell home-community">
        <div>
          <span className="community-kicker"><UsersRound size={17} aria-hidden="true" /> THE PEOPLE MAKE IT</span>
          <h2>Don&apos;t just attend.<br /><em>Find your team.</em></h2>
          <p>Meet students with complementary skills, team up for competitions, and work on something bigger than a solo project.</p>
          <Link href="/auth/register" className="community-action">Create your student account <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="community-graphic" aria-hidden="true">
          <span className="graphic-orbit orbit-one"><Code2 size={30} /></span>
          <span className="graphic-orbit orbit-two"><Sparkles size={30} /></span>
          <span className="graphic-orbit orbit-three"><Trophy size={30} /></span>
          <span className="graphic-center"><UsersRound size={46} /></span>
        </div>
      </section>
    </>
  );
}
