import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  categories,
  eventDate,
  formats,
  isCategory,
  isFormat,
  listEvents,
  searchLimit,
  sourceStatus,
} from "@/lib/events";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string | string[];
    format?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    upcoming?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : undefined;
  const format = isFormat(params.format) ? params.format : undefined;
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, searchLimit) : "";
  const upcomingOnly = params.upcoming === "1";
  const latestFirst = params.sort === "latest";
  const page =
    typeof params.page === "string" && /^[1-9][0-9]{0,5}$/.test(params.page)
      ? Number(params.page)
      : 1;
  const result = await listEvents({
    category,
    format,
    search,
    latestFirst,
    upcomingOnly,
    page,
  });

  function pageHref(target: number) {
    const query = new URLSearchParams({ page: String(target) });
    if (category) query.set("category", category);
    if (format) query.set("format", format);
    if (search) query.set("q", search);
    if (upcomingOnly) query.set("upcoming", "1");
    if (latestFirst) query.set("sort", "latest");
    return `/events?${query}`;
  }

  return (
    <section className="shell section">
      <h1>{upcomingOnly ? "Upcoming events" : "Explore events"}</h1>
      <Link
        className="underlined"
        href={upcomingOnly ? "/events" : "/events?upcoming=1"}
      >
        {upcomingOnly ? "Browse all dates" : "Show upcoming only"}
      </Link>
      <p className="meta">Browse published technology events across Algeria.</p>
      <form className="filter" action="/events">
        {upcomingOnly && <input name="upcoming" type="hidden" value="1" />}
        <label className="event-search" htmlFor="q">
          Search by title
          <input
            id="q"
            name="q"
            type="search"
            maxLength={searchLimit}
            defaultValue={search}
          />
        </label>
        <label htmlFor="category">
          Category
          <select id="category" name="category" defaultValue={category ?? ""}>
            <option value="">All categories</option>
            {Object.entries(categories).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="format">
          Format
          <select id="format" name="format" defaultValue={format ?? ""}>
            <option value="">All formats</option>
            {Object.entries(formats).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="sort">
          Sort by start date
          <select
            id="sort"
            name="sort"
            defaultValue={latestFirst ? "latest" : ""}
          >
            <option value="">Earliest first</option>
            <option value="latest">Latest first</option>
          </select>
        </label>
        <Button type="submit">Apply filter</Button>
      </form>
      {!result.ok ? (
        <p role="status" className="notice">
          Events are temporarily unavailable.
        </p>
      ) : (
        <>
          {result.events.length === 0 ? (
            <p className="notice" role="status">
              {search || category || format
                ? "No published events match these filters."
                : "No published events on this page."}
            </p>
          ) : (
            <div className="event-grid">
              {result.events.map((event) => (
                <Link
                  className="event-card"
                  key={event.id}
                  href={`/events/${event.slug}`}
                >
                  <span className="meta">
                    {sourceStatus(event.source_status)}
                  </span>
                  <strong>{event.title}</strong>
                  <time className="meta" dateTime={event.starts_at}>
                    {eventDate(event.starts_at)}
                  </time>
                  <span>
                    {event.location ??
                      (isFormat(event.format)
                        ? formats[event.format]
                        : event.format)}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {(page > 1 || result.hasNext) && (
            <nav className="pagination" aria-label="Event pages">
              {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
              {result.hasNext && <Link href={pageHref(page + 1)}>Next</Link>}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
