import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Blocks, CalendarDays, ChevronRight,
  Code2, Compass, Cpu, Fingerprint, Flame, Globe2, Layers3, MapPin,
  Search, ShieldCheck, Sparkles, TerminalSquare, Trophy, UsersRound, Zap,
} from "lucide-react";
import { EventArtwork } from "@/components/event-artwork";
import { categories, eventDate, listEvents, sourceStatus } from "@/lib/events";

const tracks = [
  { id: "hackathon", name: "Hackathons", label: "BUILD SOMETHING REAL", description: "Make it. Break it. Make it better.", icon: Trophy, style: "electric" },
  { id: "ai", name: "AI & machine learning", label: "THINK BIGGER", description: "Push the edge of what's possible.", icon: Sparkles, style: "violet" },
  { id: "coding", name: "Code battles", label: "LEVEL UP", description: "Solve, compete and grow.", icon: Code2, style: "orange" },
  { id: "ctf", name: "Cybersecurity", label: "FIND THE FLAG", description: "Curiosity is your superpower.", icon: Fingerprint, style: "cyan" },
  { id: "robotics", name: "Robotics", label: "THINK IN MOTION", description: "From circuits to the real world.", icon: Cpu, style: "rose" },
  { id: "workshop", name: "Workshops", label: "LEARN BY DOING", description: "Pick up something new.", icon: Layers3, style: "mint" },
] as const;

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await listEvents({ search: "", latestFirst: false, page: 1, upcomingOnly: true });
  const upcoming = result.ok ? result.events.slice(0, 4) : [];
  const lead = upcoming[0];

  return (
    <>
      <section className="v3-hero">
        <div className="v3-hero-noise" aria-hidden="true" />
        <div className="shell v3-hero-main">
          <div className="v3-hero-copy" data-reveal>
            <div className="v3-eyebrow"><span className="v3-live-pip" aria-hidden="true" /><span>THE HOME FOR STUDENT BUILDERS</span><span className="v3-eyebrow-index">/ ALGERIA</span></div>
            <h1>Make your <span className="v3-hero-title-stroke">next</span><br />big thing <em>happen<span className="v3-h1-star">✳</span></em></h1>
            <p>Discover the hackathons, challenges, and people that turn a random idea into something worth talking about.</p>
            <form className="v3-hero-search" action="/events" method="get" role="search">
              <Search size={21} aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">Search hackathons and tech events</label>
              <input id="hero-search" type="search" name="q" placeholder="What do you want to build?" maxLength={100} />
              <button type="submit">Find events <ArrowUpRight size={17} aria-hidden="true" /></button>
            </form>
            <div className="v3-hero-suggestions">
              <span>TRY</span>
              <Link href="/events?category=hackathon">Hackathons <ArrowUpRight size={13} aria-hidden="true" /></Link>
              <Link href="/events?category=ai">Artificial intelligence <ArrowUpRight size={13} aria-hidden="true" /></Link>
              <Link href="/events?upcoming=1">Upcoming <ArrowUpRight size={13} aria-hidden="true" /></Link>
            </div>
            <div className="v3-hero-social">
              <div className="v3-social-avatars" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>
              <span><strong>Learn. Team up. Ship.</strong><small>Real opportunities, no made-up events.</small></span>
            </div>
          </div>
          <div className="v3-hero-visual" data-reveal>
            <div className="v3-visual-satellite v3-visual-satellite-left" aria-hidden="true"><Zap size={25} /><span>YOUR NEXT MOVE</span></div>
            <div className="v3-visual-satellite v3-visual-satellite-right" aria-hidden="true"><span className="v3-satellite-asterisk">✳</span> MADE TO BUILD</div>
            <div className="v3-visual-frame">
              <div className="v3-visual-frame-heading">
                <span><span className="v3-pulse-ring" /> ON YOUR RADAR</span>
                <span className="v3-visual-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
              {lead ? (
                <Link className="v3-hero-event" href={`/events/${lead.slug}`}>
                  <EventArtwork title={lead.title} slug={lead.slug} cover={lead.cover_path} className="v3-lead-art" priority />
                  <span className="v3-hero-event-body">
                    <span className="v3-hero-event-kind">{categories[lead.category as keyof typeof categories] ?? "Tech event"} <ArrowUpRight size={17} aria-hidden="true" /></span>
                    <strong>{lead.title}</strong>
                    <span className="v3-hero-event-bottom"><CalendarDays size={15} aria-hidden="true" /> {eventDate(lead.starts_at)}</span>
                  </span>
                </Link>
              ) : (
                <div className="v3-hero-concept">
                  <div className="v3-concept-symbol" aria-hidden="true">
                    <span className="v3-concept-orbit orbit-outer" />
                    <span className="v3-concept-orbit orbit-middle" />
                    <span className="v3-concept-orbit orbit-inner" />
                    <span className="v3-concept-glyph"><Blocks size={55} strokeWidth={1.3} /></span>
                    <span className="v3-concept-spark sparkle-one">✳</span>
                    <span className="v3-concept-spark sparkle-two">✳</span>
                  </div>
                  <div className="v3-concept-copy">
                    <span>WHAT WILL YOU BUILD?</span>
                    <strong>The next big thing<br />isn&apos;t on a list yet.</strong>
                    <p>Find your kind of challenge.</p>
                  </div>
                </div>
              )}
              <div className="v3-frame-links">
                <Link href="/events?category=hackathon"><span className="v3-frame-link-icon">01</span><span>Explore hackathons</span><ArrowUpRight size={17} aria-hidden="true" /></Link>
                <Link href="/events?category=ai"><span className="v3-frame-link-icon">02</span><span>Explore AI challenges</span><ArrowUpRight size={17} aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="v3-float-tag" aria-hidden="true"><TerminalSquare size={18} /> BUILD / CREATE / REPEAT <span>✳</span></div>
          </div>
        </div>
        <div className="v3-hero-bottom shell">
          <a href="#explore-tracks" className="v3-scroll-cue"><span className="v3-scroll-cue-icon"><ArrowDown size={18} aria-hidden="true" /></span> SCROLL TO EXPLORE</a>
          <div className="v3-hero-bottom-right"><span>01</span> / THE NEXT GENERATION STARTS HERE</div>
        </div>
      </section>

      <section className="v3-ticker" aria-label="Discover your kind of challenge">
        <div className="v3-ticker-track">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="v3-ticker-content">
              <span>IDEAS INTO ACTION <Sparkles size={21} /></span>
              <span>HACKATHONS <span className="v3-ticker-star">✳</span></span>
              <span>CODE. CREATE. CONNECT. <TerminalSquare size={22} /></span>
              <span>BUILD DIFFERENT <span className="v3-ticker-star">✳</span></span>
            </div>
          ))}
        </div>
      </section>

      <section id="explore-tracks" className="v3-tracks-section shell">
        <div className="v3-section-header" data-reveal>
          <div>
            <span className="v3-section-kicker"><span>01 / 03</span> PICK YOUR PLAYGROUND</span>
            <h2>Different minds.<br /><em>One big playground.</em></h2>
          </div>
          <div className="v3-section-intro">
            <p>Every curiosity deserves a starting point. Choose what excites you, then find the events behind it.</p>
            <Link href="/events" className="v3-section-link">Browse everything <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="v3-track-grid">
          {tracks.map(({ id, name, label, description, icon: Icon, style }, index) => (
            <Link href={`/events?category=${id}`} className={`v3-track-card v3-track-${style}`} key={id} data-reveal>
              <span className="v3-track-card-top"><span>{String(index + 1).padStart(2, "0")}/06</span><ArrowUpRight size={20} aria-hidden="true" /></span>
              <span className="v3-track-art" aria-hidden="true"><span className="v3-track-art-ring" /><Icon size={index === 0 ? 63 : 53} strokeWidth={1.5} /></span>
              <span className="v3-track-card-body"><span>{label}</span><strong>{name}</strong><small>{description}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="v3-radar-section">
        <div className="shell">
          <div className="v3-section-header" data-reveal>
            <div>
              <span className="v3-section-kicker"><span>02 / 03</span> THE OPPORTUNITY RADAR</span>
              <h2>Good things are<br /><em>on the horizon.</em></h2>
            </div>
            <div className="v3-section-intro">
              <p>Real events. Real organizers. Zero filler. Keep your eyes on the opportunities that matter.</p>
              <Link href="/events?upcoming=1" className="v3-section-link">View upcoming events <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
          {upcoming.length > 0 ? (
            <div className="v3-featured-grid" data-reveal>
              {upcoming.map((event, index) => (
                <Link key={event.id} href={`/events/${event.slug}`} className={`v3-event-card ${index === 0 ? "v3-event-featured" : ""}`}>
                  <div className="v3-event-image">
                    <EventArtwork slug={event.slug} title={event.title} cover={event.cover_path} />
                    <span className="v3-event-image-flag">{categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
                  </div>
                  <div className="v3-event-meta"><span>{sourceStatus(event.source_status)}</span><ArrowUpRight size={19} /></div>
                  <h3>{event.title}</h3>
                  <div className="v3-event-details"><span><CalendarDays size={15} />{eventDate(event.starts_at)}</span><span><MapPin size={15} />{event.location || event.format}</span></div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="v3-radar-empty" data-reveal>
              <div className="v3-radar-screen">
                <div className="v3-radar-rings" aria-hidden="true"><span /><span /><span /><span className="v3-radar-blip" /></div>
                <span className="v3-radar-screen-top">SCANNING THE HORIZON <span className="v3-blink">●</span></span>
                <span className="v3-radar-coordinates" aria-hidden="true">36° N / 3° E</span>
              </div>
              <div className="v3-radar-empty-content">
                <span className="v3-section-kicker">NO PUBLISHED UPCOMING EVENTS YET</span>
                <h3>Something great<br />starts <em>somewhere.</em></h3>
                <p>{result.ok
                  ? "Our radar will showcase approved student tech events here. Until then, discover the categories and get ready to build."
                  : "Live event information isn't available right now. You can still explore the directory and sign in to your student workspace."}</p>
                <div className="v3-radar-actions"><Link href="/events" className="v3-pill-primary">Explore events <ArrowUpRight size={17} /></Link><Link href="/auth/register" className="v3-text-link">Join HackMate <ArrowRight size={17} /></Link></div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v3-how-section shell" id="how-it-works">
        <div className="v3-section-header" data-reveal>
          <div><span className="v3-section-kicker"><span>03 / 03</span> FROM WHAT IF TO WHAT'S NEXT</span><h2>It starts with <em>you.</em></h2></div>
          <div className="v3-section-intro"><p>You don&apos;t need everything figured out. Just a challenge, an open mind and people to build alongside.</p></div>
        </div>
        <div className="v3-journey">
          {[
            { index: "01", icon: Compass, title: "Find your spark", body: "Discover the hackathons, competitions and experiences that feel like you.", href: "/events", link: "Explore events" },
            { index: "02", icon: UsersRound, title: "Find your people", body: "Connect with students with different skills and the same ambition.", href: "/teams", link: "Find a team" },
            { index: "03", icon: Zap, title: "Make it real", body: "Show up, learn something new and build the thing you can't stop thinking about.", href: "/auth/register", link: "Get started" },
          ].map(({ index, icon: Icon, title, body, href, link }) => (
            <article className="v3-journey-step" key={index} data-reveal>
              <div className="v3-journey-index">{index} <span>✳</span></div>
              <div className="v3-journey-icon"><Icon size={30} aria-hidden="true" /></div>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link href={href}>{link} <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="v3-community-banner shell" data-reveal>
        <div className="v3-community-text">
          <span className="v3-community-eyebrow"><Globe2 size={16} /> PEOPLE > SOLO PROJECTS</span>
          <h2>The best ideas<br />happen <em>together.</em></h2>
          <p>Good builders are everywhere. Finding your people shouldn't be hard. Step into a community that wants to make things happen.</p>
          <div className="v3-community-actions">
            <Link className="v3-community-join" href="/auth/register">Join the community <ArrowUpRight size={19} aria-hidden="true" /></Link>
            <Link className="v3-community-explore" href="/community">See the community <ChevronRight size={19} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="v3-community-visual" aria-hidden="true">
          <span className="v3-community-orbit v3-co-one"><Code2 size={29} /></span>
          <span className="v3-community-orbit v3-co-two"><Flame size={27} /></span>
          <span className="v3-community-orbit v3-co-three"><ShieldCheck size={28} /></span>
          <span className="v3-community-orbit v3-co-four"><Cpu size={28} /></span>
          <span className="v3-community-center"><UsersRound size={60} /><span>BETTER<br />TOGETHER</span></span>
          <span className="v3-community-orbit-line v3-col-one" /><span className="v3-community-orbit-line v3-col-two" />
        </div>
      </section>
    </>
  );
}
