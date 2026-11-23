import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  Flag,
  MapPin,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/action-form";
import { reportItem, saveBookmark } from "@/app/account/event/actions";
import {
  categories,
  eventDate,
  eventSkillNames,
  externalUrl,
  formats,
  getEvent,
  relatedEvents,
  sourceStatus,
} from "@/lib/events";
import { memberSession } from "@/lib/supabase/server";
import { httpsUrl } from "@/lib/forms";

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
    openGraph: { title: event.title, description, url: path, type: "website" },
  };
}

export default async function EventPage({ params }: Props) {
  const result = await eventForRequest((await params).slug);
  if (result.status === "missing") notFound();
  if (result.status === "unavailable") {
    return (
      <section className="shell section">
        <h1>Event unavailable</h1>
        <p>We couldn&apos;t load this event right now.</p>
        <Link href="/events" className="underlined">Back to events</Link>
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
  const cover = httpsUrl(event.cover_path);
  const deadlinePassed = result.registrationClosed;
  const source = externalUrl(event.official_url) ?? externalUrl(event.source_url);
  const category = categories[event.category as keyof typeof categories] ?? "Tech event";
  const format = formats[event.format as keyof typeof formats] ?? event.format;

  return (
    <article className="shell section event-detail">
      <Link className="event-breadcrumb" href="/events">
        <ArrowLeft size={16} aria-hidden="true" /> Back to events
      </Link>
      <header className="event-detail-hero">
        <div className="event-detail-labels">
          <span className="event-detail-category">{category}</span>
          <span className="event-detail-format">{format}</span>
        </div>
        <h1>{event.title}</h1>
        <p className="event-hosted">Organized by <strong>{event.organizer}</strong></p>
        <span className="event-detail-source">{sourceStatus(event.source_status)}</span>
      </header>
      {cover && (
        <div className="event-detail-cover">
          {/* eslint-disable-next-line @next/next/no-img-element -- Externally hosted event cover is loaded directly after URL validation. */}
          <img src={cover} alt="" width={1100} height={440} referrerPolicy="no-referrer" loading="lazy" />
        </div>
      )}
      <div className="event-detail-grid">
        <div className="event-detail-main">
          <section className="event-about">
            <p className="section-overline">THE OPPORTUNITY</p>
            <h2>About this event</h2>
            <p className="event-description">{event.description}</p>
          </section>
          {(event.eligibility || event.prizes) && (
            <section className="event-detail-block">
              <h2>What to know</h2>
              {event.eligibility && (
                <div className="event-detail-info-row">
                  <strong>Who can participate</strong>
                  <p>{event.eligibility}</p>
                </div>
              )}
              {event.prizes && (
                <div className="event-detail-info-row">
                  <strong>Prizes and recognition</strong>
                  <p>{event.prizes}</p>
                </div>
              )}
            </section>
          )}
          <section className="event-detail-block">
            <h2>Building with a team?</h2>
            <p className="event-detail-help">Know the team requirements before you start looking for collaborators.</p>
            <div className="event-team-info">
              <div>
                <UsersRound size={20} aria-hidden="true" />
                <div><strong>Team size</strong><span>{event.min_team_size}–{event.max_team_size} members</span></div>
              </div>
              {skills.length > 0 && (
                <div>
                  <div><strong>Relevant skills</strong><span>{skills.join(", ")}</span></div>
                </div>
              )}
            </div>
            <div className="event-team-buttons">
              {verified ? (
                <>
                  <Link href={`/teams?event=${event.id}`} className="event-team-button">
                    Find event teams <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                  <Link href={`/community?event=${event.id}`} className="event-team-secondary">
                    Find teammates <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <Link href="/auth/register" className="event-team-button">
                  Join HackMate to find teammates <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
          </section>
          {!!related.length && (
            <section className="event-related">
              <div className="teams-section-heading"><h2>More like this</h2><Link href="/events" className="underlined">All events <ArrowRight size={16} aria-hidden="true" /></Link></div>
              <div className="event-related-list">
                {related.map((item) => (
                  <Link href={`/events/${item.slug}`} key={item.id}>
                    <span><strong>{item.title}</strong><small>{eventDate(item.starts_at)}</small></span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="event-detail-side" aria-label="Event information and actions">
          <section className="event-info-card">
            <h2>Event details</h2>
            <dl>
              <div>
                <dt><CalendarDays size={18} aria-hidden="true" /> Starts</dt>
                <dd><time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time></dd>
              </div>
              <div>
                <dt><Clock3 size={18} aria-hidden="true" /> Ends</dt>
                <dd><time dateTime={event.ends_at}>{eventDate(event.ends_at)}</time></dd>
              </div>
              <div>
                <dt><MapPin size={18} aria-hidden="true" /> Location</dt>
                <dd>{event.location ?? format}</dd>
              </div>
              {event.registration_deadline && (
                <div>
                  <dt><CalendarDays size={18} aria-hidden="true" /> Registration deadline</dt>
                  <dd><time dateTime={event.registration_deadline}>{eventDate(event.registration_deadline)}</time></dd>
                </div>
              )}
            </dl>
            {deadlinePassed && <p className="event-registration-note">Registration deadline has passed.</p>}
            {registration && !deadlinePassed && (
              <Button asChild>
                <a href={registration} target="_blank" rel="noopener noreferrer">
                  Visit registration page <ExternalLink size={16} aria-hidden="true" />
                </a>
              </Button>
            )}
            {!registration && !deadlinePassed && (
              <p className="event-registration-note">No registration link has been provided. Check the event source for the latest details.</p>
            )}
            {source && (
              <a className="event-source-link" href={source} target="_blank" rel="noopener noreferrer">
                Visit event source <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            <Link className="event-calendar-link" href={`/events/${event.slug}/calendar`} prefetch={false} download>
              <CalendarDays size={17} aria-hidden="true" /> Download calendar event
            </Link>
            {verified && !bookmark?.error && (
              <ActionForm
                action={saveBookmark.bind(null, event.id, !!bookmark?.data)}
                submit={bookmark?.data ? "Remove bookmark" : "Bookmark event"}
              />
            )}
          </section>
          {verified && (
            <details className="event-report">
              <summary><Flag size={16} aria-hidden="true" /> Report incorrect information</summary>
              <ActionForm
                action={reportItem.bind(null, "event", event.id)}
                submit="Send report"
              >
                <label>
                  Reason
                  <textarea name="reason" minLength={10} maxLength={1000} required />
                </label>
              </ActionForm>
            </details>
          )}
          <p className="event-detail-disclaimer">Event information can change. Confirm dates and registration details with the organizer.</p>
        </aside>
      </div>
    </article>
  );
}
