import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Compass, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uuid } from "@/lib/forms";
import { algeriaDateStart } from "@/lib/event-calendar";
import {
  categories,
  eventDate,
  formats,
  isCategory,
  isFormat,
  listEvents,
  listEventUniversities,
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
    university?: string | string[];
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
  const universityId =
    typeof params.university === "string" && uuid.safeParse(params.university).success
      ? params.university
      : undefined;
  const universities = await listEventUniversities();
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
        universityId,
        openRegistration: registrationOpen,
        from,
        until: to ? new Date(to.getTime() + 86_400_000) : null,
        page,
      });

  // Server-driven filters use uncontrolled form inputs. Remount them when
  // navigation changes the query, otherwise cleared fields stay visually stale.
  const formKey = [
    category ?? "", format ?? "", search, location, universityId ?? "",
    from?.toISOString() ?? "", to?.toISOString() ?? "",
    String(registrationOpen), String(upcomingOnly), String(latestFirst),
  ].join("|");

  function pageHref(target: number, upcoming = upcomingOnly) {
    const query = new URLSearchParams();
    if (target > 1) query.set("page", String(target));
    if (category) query.set("category", category);
    if (format) query.set("format", format);
    if (search) query.set("q", search);
    if (location) query.set("location", location);
    if (universityId) query.set("university", universityId);
    if (from && typeof params.from === "string") query.set("from", params.from);
    if (to && typeof params.to === "string") query.set("to", params.to);
    if (registrationOpen) query.set("registration", "open");
    if (upcoming) query.set("upcoming", "1");
    if (latestFirst) query.set("sort", "latest");
    return query.size ? `/events?${query}` : "/events";
  }

  return (
    <section className="shell section">
      <div className="event-page-intro">
        <span className="section-kicker">YOUR NEXT CHALLENGE AWAITS</span>
        <h1>{upcomingOnly ? "Upcoming events" : "Explore events"}<span className="event-heading-period">.</span></h1>
        <p>Hackathons, workshops, competitions and more. Find the right opportunity to learn, compete and connect.</p>
      </div>
      <nav aria-label="Quick event filters" className="event-quick-links">
        <Link className={!upcomingOnly && !category ? "is-active" : ""} href="/events"><Compass size={16} aria-hidden="true" /> All events</Link>
        <Link className={upcomingOnly ? "is-active" : ""} href="/events?upcoming=1"><CalendarDays size={16} aria-hidden="true" /> Upcoming</Link>
        <Link className={category === "hackathon" ? "is-active" : ""} href="/events?category=hackathon">Hackathons</Link>
        <Link className={category === "workshop" ? "is-active" : ""} href="/events?category=workshop">Workshops</Link>
        <Link className={category === "coding" ? "is-active" : ""} href="/events?category=coding">Coding</Link>
      </nav>
      <div className="filter-heading"><span><SlidersHorizontal size={18} aria-hidden="true" /> Refine your search</span><Link className="underlined" href={pageHref(1, !upcomingOnly)}>{upcomingOnly ? "Browse all dates" : "Show upcoming only"}</Link></div>
      <form key={formKey} className="filter" action="/events">
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
          University
          <select name="university" defaultValue={universityId ?? ""}>
            <option value="">All universities</option>
            {universities.map((university) => (
              <option value={university.id} key={university.id}>
                {university.name}{university.city ? ` · ${university.city}` : ""}
              </option>
            ))}
          </select>
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
        <Button type="submit"><Search size={17} aria-hidden="true" /> Apply filter</Button>
        {(search ||
          category ||
          format ||
          location ||
          universityId ||
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
          <div className="results-heading"><h2>{result.events.length ? "Discover what's happening" : "Your results"}</h2><span>{result.events.length ? "Explore events matching your interests" : "Try a different search"}</span></div>
          {result.events.length === 0 ? (
            <p className="notice" role="status">
              {search ||
              category ||
              format ||
              location ||
              universityId ||
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
                  <span className="event-card-head"><span className="event-source">{sourceStatus(event.source_status)}</span><ArrowUpRight size={19} aria-hidden="true" /></span>
                  <span className="event-type">{categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
                  <strong>{event.title}</strong>
                  <span className="event-card-details">
                    <time dateTime={event.starts_at}><CalendarDays size={16} aria-hidden="true" />{eventDate(event.starts_at)}</time>
                    <span><MapPin size={16} aria-hidden="true" />{event.location ??
                      (isFormat(event.format) ? formats[event.format] : event.format)}</span>
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
