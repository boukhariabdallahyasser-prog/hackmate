import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays,
  CheckCircle2, ChevronRight, Clock3, ExternalLink, MapPin,
  ShieldCheck, Sparkles, UsersRound,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { EventArtwork } from "@/components/event-artwork";
import { reportItem, saveBookmark } from "@/app/account/event/actions";
import {
  categories,
  eventDate,
  eventSkillNames,
  externalUrl,
  getEvent,
  relatedEvents,
  sourceStatus,
} from "@/lib/events";
import { memberSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const eventForRequest = cache(getEvent);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await eventForRequest((await params).slug);
  if (result.status !== "found")
    return { title: "Event", robots: { index: false } };

  const { event } = result;
  const description = event.description.slice(0, 155);
  const path = `/events/${event.slug}`;
  return {
    title: event.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: event.title,
      description,
      url: path,
      type: "website",
      images: [event.cover_path?.startsWith("https://") ? event.cover_path : `${path}/poster`],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const result = await eventForRequest((await params).slug);
  if (result.status === "missing") notFound();
  if (result.status === "unavailable") {
    return (
      <section className="shell section v3-event-unavailable">
        <span className="v3-section-kicker">THE RADAR LOST THIS ONE</span>
        <h1>Event unavailable.</h1>
        <p>We couldn&apos;t load this opportunity right now.</p>
        <Link href="/events"><ArrowLeft size={18} aria-hidden="true" /> Back to events</Link>
      </section>
    );
  }

  const { event } = result;
  const [session, related, skills] = await Promise.all([
    memberSession(),
    relatedEvents(event),
    eventSkillNames(event.event_skills?.map((skill) => skill.skill_id) ?? []),
  ]);
  const verified = session?.access?.status === "verified";
  const bookmark = verified
    ? await session.client
        .from("event_bookmarks")
        .select("event_id")
        .eq("event_id", event.id)
        .eq("user_id", session.id)
        .maybeSingle()
    : null;
  const registration = externalUrl(event.registration_url);
  const deadlinePassed = result.registrationClosed;
  const source = externalUrl(event.official_url) ?? externalUrl(event.source_url);

  return (
    <article className="shell v3-event-detail">
      <nav className="v3-event-breadcrumb" aria-label="Breadcrumb">
        <Link href="/events"><ArrowLeft size={15} aria-hidden="true" /> All events</Link>
        <ChevronRight size={15} aria-hidden="true" />
        <span>{categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
      </nav>

      <header className="v3-event-heading">
        <div>
          <div className="v3-event-labels">
            <span className="v3-event-category-label"><Sparkles size={15} aria-hidden="true" /> {categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
            <span className="v3-event-source-label"><ShieldCheck size={15} aria-hidden="true" /> {sourceStatus(event.source_status)}</span>
          </div>
          <h1>{event.title}</h1>
          <p>Hosted by <strong>{event.organizer}</strong> <span aria-hidden="true">✳</span> {event.location ?? event.format}</p>
        </div>
        <Link href="/events?upcoming=1" className="v3-event-heading-back">More opportunities <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </header>

      <div className="v3-event-layout">
        <div className="v3-event-main">
          <EventArtwork title={event.title} slug={event.slug} cover={event.cover_path} className="detail-poster" priority />
          <section className="v3-event-section">
            <div className="v3-event-section-label"><span>01 / THE CHALLENGE</span><span aria-hidden="true">✳</span></div>
            <h2>What&apos;s it all about?</h2>
            <p className="v3-event-description">{event.description}</p>
            {skills.length > 0 && (
              <div className="v3-event-skills">
                <h3>Skills worth bringing</h3>
                <div>{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              </div>
            )}
          </section>
          {(event.eligibility || event.prizes) && (
            <section className="v3-event-section">
              <div className="v3-event-section-label"><span>02 / GOOD TO KNOW</span><span aria-hidden="true">✳</span></div>
              <div className="v3-event-info-grid">
                {event.eligibility && (
                  <div><span className="v3-event-info-icon"><CheckCircle2 size={22} aria-hidden="true" /></span><h2>Who can join?</h2><p>{event.eligibility}</p></div>
                )}
                {event.prizes && (
                  <div><span className="v3-event-info-icon"><Sparkles size={22} aria-hidden="true" /></span><h2>What&apos;s at stake?</h2><p>{event.prizes}</p></div>
                )}
              </div>
            </section>
          )}
          <section className="v3-event-section v3-event-collaborate">
            <div className="v3-event-section-label"><span>03 / BETTER TOGETHER</span><span aria-hidden="true">✳</span></div>
            <h2>Find your people.</h2>
            <p>Big ideas rarely happen alone. Find teammates with the right skills and get building.</p>
            <div className="v3-event-team-links">
              <Link href={`/teams?event=${event.id}`}><UsersRound size={19} aria-hidden="true" /> Find event teams <ArrowUpRight size={17} aria-hidden="true" /></Link>
              <Link href={`/community?event=${event.id}`}>Find teammates <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </section>
          {verified && (
            <section className="v3-event-section v3-event-tools">
              <h2>Your event tools</h2>
              {!bookmark?.error && (
                <ActionForm
                  action={saveBookmark.bind(null, event.id, !!bookmark?.data)}
                  submit={bookmark?.data ? "Remove bookmark" : "Bookmark event"}
                />
              )}
              <details className="v3-event-report">
                <summary>Report a problem with this event</summary>
                <ActionForm action={reportItem.bind(null, "event", event.id)} submit="Send report">
                  <label>Reason<textarea name="reason" minLength={10} maxLength={1000} required /></label>
                </ActionForm>
              </details>
            </section>
          )}
        </div>

        <aside className="v3-event-sidebar" aria-label="Event details and registration">
          <div className="v3-register-panel">
            <span className="v3-register-panel-kicker"><span className="v3-live-pip" /> YOUR NEXT MOVE</span>
            <h2>Ready to make<br />something happen?</h2>
            <div className="v3-register-panel-details">
              <div><CalendarDays size={19} aria-hidden="true" /><span><small>STARTS</small><time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time></span></div>
              <div><Clock3 size={19} aria-hidden="true" /><span><small>ENDS</small><time dateTime={event.ends_at}>{eventDate(event.ends_at)}</time></span></div>
              <div><MapPin size={19} aria-hidden="true" /><span><small>LOCATION</small><strong>{event.location ?? event.format}</strong></span></div>
              <div><UsersRound size={19} aria-hidden="true" /><span><small>TEAM SIZE</small><strong>{event.min_team_size}–{event.max_team_size} people</strong></span></div>
            </div>
            {event.registration_deadline && (
              <p className={deadlinePassed ? "v3-registration-deadline deadline-passed" : "v3-registration-deadline"}>
                {deadlinePassed ? "Registration closed" : "Registration deadline"} · <time dateTime={event.registration_deadline}>{eventDate(event.registration_deadline)}</time>
              </p>
            )}
            {registration && !deadlinePassed ? (
              <a className="v3-register-button" href={registration} target="_blank" rel="noopener noreferrer">
                Visit registration page <ExternalLink size={18} aria-hidden="true" />
              </a>
            ) : (
              <p className="v3-register-unavailable">
                {deadlinePassed ? "The organizer's registration deadline has passed." : "No registration link is available. Check the official source for instructions."}
              </p>
            )}
            <Link className="v3-calendar-link" href={`/events/${event.slug}/calendar`} prefetch={false} download>
              <CalendarDays size={17} aria-hidden="true" /> Download calendar event <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            {source && (
              <a href={source} className="v3-source-link" target="_blank" rel="noopener noreferrer">
                Check the event source <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
            <p className="v3-source-note">Always verify details and eligibility with the organizer before registering.</p>
          </div>
          <div className="v3-sidebar-small-card"><Bookmark size={21} aria-hidden="true" /><div><strong>Keep your best finds.</strong><p>Sign in to save events and plan your next move.</p><Link href="/account/saved">Your saved events <ArrowRight size={14} aria-hidden="true" /></Link></div></div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="v3-related-events">
          <div className="v3-section-header"><div><span className="v3-section-kicker">KEEP EXPLORING</span><h2>More to get <em>excited about.</em></h2></div><Link href="/events" className="v3-section-link">All opportunities <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <div className="v3-related-grid">{related.map((item) => <Link key={item.id} href={`/events/${item.slug}`}><span>{eventDate(item.starts_at)}</span><strong>{item.title}</strong><ArrowUpRight size={22} aria-hidden="true" /></Link>)}</div>
        </section>
      )}
    </article>
  );
}
