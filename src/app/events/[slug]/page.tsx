import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Button } from "@/components/ui/button";
import { eventDate, externalUrl, getEvent, sourceStatus } from "@/lib/events";

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
        <Link href="/events">Back to events</Link>
      </section>
    );
  }

  const { event } = result;
  const registration = externalUrl(event.registration_url);
  const source =
    externalUrl(event.official_url) ?? externalUrl(event.source_url);
  return (
    <article className="shell section prose">
      <Link href="/events">All events</Link>
      <p className="meta">{sourceStatus(event.source_status)}</p>
      <h1>{event.title}</h1>
      <p>
        {event.organizer} · {event.location ?? event.format}
      </p>
      <p>
        <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time> –{" "}
        <time dateTime={event.ends_at}>{eventDate(event.ends_at)}</time>{" "}
        (Algeria time)
      </p>
      {event.registration_deadline && (
        <p>Registration deadline {eventDate(event.registration_deadline)}</p>
      )}
      <p>{event.description}</p>
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
      {registration && (
        <Button asChild>
          <a href={registration}>Visit registration page</a>
        </Button>
      )}
      {source && (
        <p>
          <a href={source}>Visit event source</a>
        </p>
      )}
    </article>
  );
}
