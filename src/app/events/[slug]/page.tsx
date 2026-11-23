import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/action-form";
import { reportItem, saveBookmark } from "@/app/account/event/actions";
import {
  eventDate,
  eventSkillNames,
  externalUrl,
  getEvent,
  relatedEvents,
  sourceStatus,
} from "@/lib/events";
import { memberSession } from "@/lib/supabase/server";
import { EventArtwork } from "@/components/event-artwork";

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
    openGraph: { title: event.title, description, url: path, type: "website", images: [event.cover_path?.startsWith("https://") ? event.cover_path : `${path}/poster`] },
  };
}

export default async function EventPage({ params }: Props) {
  const result = await eventForRequest((await params).slug);
  if (result.status === "missing") notFound();
  if (result.status === "unavailable") {
    return (
      <section className="shell section">
        <h1>Event unavailable</h1>
        <Link href="/events">Back to events</Link>
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
  const source =
    externalUrl(event.official_url) ?? externalUrl(event.source_url);
  return (
    <article className="shell section prose">
      <Link href="/events">All events</Link>
      <p className="meta">{sourceStatus(event.source_status)}</p>
      <h1>{event.title}</h1>
      <EventArtwork title={event.title} slug={event.slug} cover={event.cover_path} className="detail-poster" priority />
      <p>
        {event.organizer} · {event.location ?? event.format}
      </p>
      <p>
        <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time> –{" "}
        <time dateTime={event.ends_at}>{eventDate(event.ends_at)}</time>{" "}
        (Algeria time)
      </p>
      {event.registration_deadline && (
        <p>
          {deadlinePassed ? "Registration closed" : "Registration deadline"} ·{" "}
          <time dateTime={event.registration_deadline}>
            {eventDate(event.registration_deadline)}
          </time>
        </p>
      )}
      <p>{event.description}</p>
      <p>
        Team size · {event.min_team_size}–{event.max_team_size}
      </p>
      {skills.length > 0 && <p>Required skills · {skills.join(", ")}</p>}
      {event.eligibility && (
        <>
          <h2>Eligibility</h2>
          <p>{event.eligibility}</p>
        </>
      )}
      {event.prizes && (
        <>
          <h2>Prizes</h2>
          <p>{event.prizes}</p>
        </>
      )}
      <div className="text-links">
        {registration && !deadlinePassed && (
          <Button asChild>
            <a href={registration}>Visit registration page</a>
          </Button>
        )}
        <Link
          className="underlined"
          href={`/events/${event.slug}/calendar`}
          prefetch={false}
          download
        >
          Download calendar event
        </Link>
      </div>
      {source && (
        <p>
          <a href={source}>Visit event source</a>
        </p>
      )}
      {verified && (
        <div className="card-list">
          <div className="text-links">
            <Link href={`/teams?event=${event.id}`}>Find event teams</Link>
            <Link href={`/community?event=${event.id}`}>Find teammates</Link>
          </div>
          {!bookmark?.error && (
            <ActionForm
              action={saveBookmark.bind(null, event.id, !!bookmark?.data)}
              submit={bookmark?.data ? "Remove bookmark" : "Bookmark event"}
            />
          )}
          <details className="notice">
            <summary>Report event</summary>
            <ActionForm
              action={reportItem.bind(null, "event", event.id)}
              submit="Send report"
            >
              <label>
                Reason
                <textarea
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </label>
            </ActionForm>
          </details>
        </div>
      )}
      {!!related.length && (
        <div className="card-list">
          <h2>Related events</h2>
          <ul>
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/events/${item.slug}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
