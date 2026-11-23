import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Compass,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
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

export const metadata: Metadata = { title: "Explore events" };
export const dynamic = "force-dynamic";

function dateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("en-DZ", {
      day: "2-digit",
      timeZone: "Africa/Algiers",
    }).format(date),
    month: new Intl.DateTimeFormat("en-DZ", {
      month: "short",
      timeZone: "Africa/Algiers",
    }).format(date),
  };
}

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

  const hasFilters = !!(
    search ||
    category ||
    format ||
    location ||
    from ||
    to ||
    registrationOpen ||
    latestFirst
  );

  return (
    <section className="shell section events-page">
      <div className="page-intro">
        <div className="eyebrow page-eyebrow"><Compass size={16} aria-hidden="true" /> EXPLORE OPPORTUNITIES</div>
        <div className="page-intro-row">
          <div>
            <h1>{upcomingOnly ? "Upcoming events" : "Find your next challenge."}</h1>
            <p>Hackathons, coding competitions, workshops, and student tech events across Algeria. All in one place.</p>
          </div>
          <div className="page-intro-mark" aria-hidden="true"><Sparkles size={34} /></div>
        </div>
      </div>
      <nav className="event-view-tabs" aria-label="Event views">
        <Link className={!upcomingOnly && !registrationOpen ? "selected" : ""} href="/events">All events</Link>
        <Link className={upcomingOnly && !registrationOpen ? "selected" : ""} href="/events?upcoming=1">Upcoming</Link>
        <Link className={registrationOpen ? "selected" : ""} href="/events?registration=open">Open registration</Link>
      </nav>
      <form className="filter filters-panel" action="/events">
        {upcomingOnly && <input name="upcoming" type="hidden" value="1" />}
        <div className="filter-top">
          <label className="event-search" htmlFor="q">
            Search by title
            <span className="input-with-icon">
              <Search size={18} aria-hidden="true" />
              <input
                id="q"
                name="q"
                type="search"
                maxLength={searchLimit}
                placeholder="Search an event..."
                defaultValue={search}
              />
            </span>
          </label>
          <label htmlFor="category">
            Category
            <select id="category" name="category" defaultValue={category ?? ""}>
              <option value="">All categories</option>
              {Object.entries(categories).map(([value, name]) => (
                <option key={value} value={value}>{name}</option>
              ))}
            </select>
          </label>
          <label htmlFor="format">
            Format
            <select id="format" name="format" defaultValue={format ?? ""}>
              <option value="">Any format</option>
              {Object.entries(formats).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label htmlFor="sort">
            Sort by start date
            <select id="sort" name="sort" defaultValue={latestFirst ? "latest" : ""}>
              <option value="">Earliest first</option>
              <option value="latest">Latest first</option>
            </select>
          </label>
        </div>
        <div className="filter-bottom">
          <label>
            City or venue
            <input
              name="location"
              type="search"
              maxLength={searchLimit}
              placeholder="e.g. Algiers"
              defaultValue={location}
            />
          </label>
          <label>
            Registration
            <select name="registration" defaultValue={registrationOpen ? "open" : ""}>
              <option value="">Any status</option>
              <option value="open">Known deadline still open</option>
            </select>
          </label>
          <details className="date-filters" open={!!(from || to)}>
            <summary><SlidersHorizontal size={16} aria-hidden="true" /> Date range <ChevronDown size={15} aria-hidden="true" /></summary>
            <div className="date-filter-inputs">
              <label>
                From date
                <input name="from" type="date" defaultValue={from && typeof params.from === "string" ? params.from : ""} />
              </label>
              <label>
                Through date
                <input name="to" type="date" defaultValue={to && typeof params.to === "string" ? params.to : ""} />
              </label>
            </div>
          </details>
          <Button type="submit">Apply filter <ArrowRight size={16} aria-hidden="true" /></Button>
          {hasFilters && (
            <Link className="clear-filters" href={upcomingOnly ? "/events?upcoming=1" : "/events"}>Clear filters</Link>
          )}
        </div>
      </form>
      <div className="results-heading">
        <div>
          <h2>Browse events</h2>
          <p>{!result ? "Check your selected dates." : !result.ok ? "Could not load the directory." : `Showing ${result.events.length} event${result.events.length === 1 ? "" : "s"} on this page`}</p>
        </div>
        <span className="results-verified"><CalendarDays size={16} aria-hidden="true" /> Published listings</span>
      </div>
      {!result ? (
        <div className="empty-state" role="alert">
          <CalendarDays size={28} aria-hidden="true" />
          <h3>Check your dates</h3>
          <p>The end date must be on or after the start date.</p>
        </div>
      ) : !result.ok ? (
        <div className="empty-state" role="status">
          <Compass size={28} aria-hidden="true" />
          <h3>Events are temporarily unavailable</h3>
          <p>We couldn&apos;t load the directory right now. Please try again later.</p>
        </div>
      ) : (
        <>
          {result.events.length === 0 ? (
            <div className="empty-state" role="status">
              <Search size={28} aria-hidden="true" />
              <h3>No events found</h3>
              <p>{hasFilters ? "No published events match these filters." : "No published events on this page."}</p>
              {hasFilters && <Link href="/events" className="empty-action">Browse all events <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          ) : (
            <div className="event-grid">
              {result.events.map((event) => {
                const date = dateParts(event.starts_at);
                return (
                  <Link className="event-card" key={event.id} href={`/events/${event.slug}`}>
                    <div className="event-card-top">
                      <span className="event-category">{categories[event.category as keyof typeof categories] ?? "Tech event"}</span>
                      <ArrowUpRight className="event-card-open" size={20} aria-hidden="true" />
                    </div>
                    <div className="event-card-main">
                      <time className="event-date-chip" dateTime={event.starts_at}>
                        <strong>{date.day}</strong><span>{date.month}</span>
                      </time>
                      <div>
                        <strong className="event-title">{event.title}</strong>
                        <p className="event-organizer">{event.organizer}</p>
                      </div>
                    </div>
                    <div className="event-card-bottom">
                      <span><MapPin size={15} aria-hidden="true" /> {event.location ?? (isFormat(event.format) ? formats[event.format] : event.format)}</span>
                      <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time>
                    </div>
                    <span className="event-source">{sourceStatus(event.source_status)}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {(page > 1 || result.hasNext) && (
            <nav className="pagination" aria-label="Event pages">
              {page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}
              <span>Page {page}</span>
              {result.hasNext && <Link href={pageHref(page + 1)}>Next <ArrowRight size={16} aria-hidden="true" /></Link>}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
