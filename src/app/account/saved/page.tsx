import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { saveBookmark } from "@/app/account/event/actions";
import { eventDate } from "@/lib/events";
import { requireMember } from "@/lib/supabase/server";
import { updateSavedEvent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved events", robots: { index: false } };

const plans = {
  interested: "Interested",
  planning: "Planning to attend",
  registered: "Registered",
} as const;

export default async function SavedEventsPage() {
  const { client, id } = await requireMember("verified");
  const { data: saved, error: savedError } = await client
    .from("event_bookmarks")
    .select("event_id,created_at,attendance_plan,personal_note")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (savedError)
    return (
      <section className="saved-workspace">
        <h1>Saved events</h1>
        <p role="alert" className="notice">
          Your saved events are unavailable. The saved-event database migration
          may not have been applied yet.
        </p>
      </section>
    );

  if (!saved?.length)
    return (
      <section className="saved-workspace">
        <span className="section-kicker">YOUR SHORTLIST</span>
        <h1>Saved events</h1>
        <div className="saved-empty">
          <Bookmark size={30} aria-hidden="true" />
          <h2>Start collecting opportunities.</h2>
          <p>Save events from their detail pages and keep your plans in one place.</p>
          <Link href="/events?upcoming=1">Explore upcoming events <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    );

  const { data: events, error: eventError } = await client
    .from("events")
    .select(
      "id,slug,title,starts_at,location,format,category,moderation_status",
    )
    .eq("moderation_status", "approved")
    .in("id", saved.map((item) => item.event_id));

  if (eventError)
    return <p role="alert" className="notice">Saved event details are temporarily unavailable.</p>;

  const byId = new Map(events?.map((event) => [event.id, event]));
  const visible = saved.flatMap((bookmark) => {
    const event = byId.get(bookmark.event_id);
    return event ? [{ bookmark, event }] : [];
  });

  return (
    <section className="saved-workspace">
      <span className="section-kicker">YOUR SHORTLIST</span>
      <h1>Saved events</h1>
      <p className="meta">
        Keep notes and track where you stand. Only you can see your plans.
        Events removed by moderators are not displayed.
      </p>
      {!visible.length ? (
        <div className="saved-empty">
          <ClipboardList size={28} aria-hidden="true" />
          <h2>No currently published saved events.</h2>
          <p>Browse the directory to discover other opportunities.</p>
          <Link href="/events">Browse events <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="saved-list">
          {visible.map(({ bookmark, event }) => (
            <article className="saved-event" key={event.id}>
              <div className="saved-event-heading">
                <div>
                  <span className="section-kicker">{event.category.replaceAll("_", " ")}</span>
                  <h2><Link href={`/events/${event.slug}`}>{event.title} <ArrowUpRight size={18} aria-hidden="true" /></Link></h2>
                  <p className="saved-event-details">
                    <span><CalendarDays size={15} aria-hidden="true" /> {eventDate(event.starts_at)}</span>
                    <span><MapPin size={15} aria-hidden="true" /> {event.location || event.format}</span>
                  </p>
                </div>
                <ActionForm
                  action={saveBookmark.bind(null, event.id, true)}
                  submit="Remove bookmark"
                />
              </div>
              <ActionForm action={updateSavedEvent.bind(null, event.id)} submit="Save my plan">
                <label>
                  My status
                  <select name="attendance_plan" defaultValue={bookmark.attendance_plan}>
                    {Object.entries(plans).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Private notes
                  <textarea
                    name="personal_note"
                    rows={3}
                    maxLength={600}
                    defaultValue={bookmark.personal_note}
                    placeholder="Team ideas, application requirements, what to prepare…"
                  />
                </label>
              </ActionForm>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
