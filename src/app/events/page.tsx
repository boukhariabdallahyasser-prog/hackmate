import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { algeriaDateStart } from "@/lib/event-calendar";
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
    location?: string | string[];
    from?: string | string[];
    to?: string | string[];
    registration?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : undefined;
  const format = isFormat(params.format) ? params.format : undefined;
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, searchLimit) : "";
  const location =
    typeof params.location === "string"
      ? params.location.trim().slice(0, searchLimit)
      : "";
  const from = algeriaDateStart(params.from);
  const to = algeriaDateStart(params.to);
  const dateError = from && to && from > to;
  const registrationOpen = params.registration === "open";
  const upcomingOnly = params.upcoming === "1";
  const latestFirst = params.sort === "latest";
  const page =
    typeof params.page === "string" && /^[1-9][0-9]{0,5}$/.test(params.page)
      ? Number(params.page)
      : 1;
  const result = dateError
    ? null
    : await listEvents({
        category,
        format,
        search,
        latestFirst,
        upcomingOnly,
        location,
        openRegistration: registrationOpen,
        from,
        until: to ? new Date(to.getTime() + 86_400_000) : null,
        page,
      });

  function pageHref(target: number, upcoming = upcomingOnly) {
    const query = new URLSearchParams();
    if (target > 1) query.set("page", String(target));
    if (category) query.set("category", category);
    if (format) query.set("format", format);
    if (search) query.set("q", search);
    if (location) query.set("location", location);
    if (from && typeof params.from === "string") query.set("from", params.from);
    if (to && typeof params.to === "string") query.set("to", params.to);
    if (registrationOpen) query.set("registration", "open");
    if (upcoming) query.set("upcoming", "1");
    if (latestFirst) query.set("sort", "latest");
    return query.size ? `/events?${query}` : "/events";
  }

  return (
    <section className="shell section">
      <h1>{upcomingOnly ? "Upcoming events" : "Explore events"}</h1>
      <Link className="underlined" href={pageHref(1, !upcomingOnly)}>
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
        <label>
          City or venue
          <input
            name="location"
            type="search"
            maxLength={searchLimit}
            defaultValue={location}
          />
        </label>
        <label>
          From date
          <input
            name="from"
            type="date"
            defaultValue={
              from && typeof params.from === "string" ? params.from : ""
            }
          />
        </label>
        <label>
          Through date
          <input
            name="to"
            type="date"
            defaultValue={to && typeof params.to === "string" ? params.to : ""}
          />
        </label>
        <label>
          Registration
          <select
            name="registration"
            defaultValue={registrationOpen ? "open" : ""}
          >
            <option value="">Any registration status</option>
            <option value="open">Known deadline still open</option>
          </select>
        </label>
        <Button type="submit">Apply filter</Button>
        {(search ||
          category ||
          format ||
          location ||
          from ||
          to ||
          registrationOpen ||
          latestFirst) && (
          <Link
            className="underlined"
            href={upcomingOnly ? "/events?upcoming=1" : "/events"}
          >
            Clear filters
          </Link>
        )}
      </form>
      {!result ? (
        <p className="notice" role="alert">
          The end date must be on or after the start date.
        </p>
      ) : !result.ok ? (
        <p role="status" className="notice">
          Events are temporarily unavailable.
        </p>
      ) : (
        <>
          {result.events.length === 0 ? (
            <p className="notice" role="status">
              {search ||
              category ||
              format ||
              location ||
              from ||
              to ||
              registrationOpen
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
