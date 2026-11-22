import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/supabase/server";

export default async function SubmissionsPage() {
  const { client, id } = await requireMember("verified");
  const [submissions, bookmarks] = await Promise.all([
    client
      .from("events")
      .select("id,title,slug,moderation_status")
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("event_bookmarks")
      .select("events(id,title,slug)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return (
    <section className="form-page">
      <h1>My events</h1>
      <Button asChild>
        <Link href="/account/event">Submit an event</Link>
      </Button>
      <div className="card-list">
        <h2>Submissions</h2>
        {submissions.error ? (
          <p role="alert">Submissions are temporarily unavailable.</p>
        ) : !submissions.data?.length ? (
          <p>No submissions yet.</p>
        ) : (
          <ul>
            {submissions.data.map((event) => (
              <li className="notice" key={event.id}>
                {event.moderation_status === "approved" ? (
                  <Link href={`/events/${event.slug}`}>{event.title}</Link>
                ) : (
                  event.title
                )}
                <p className="meta">{event.moderation_status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card-list">
        <h2>Bookmarks</h2>
        {bookmarks.error ? (
          <p role="alert">Bookmarks are temporarily unavailable.</p>
        ) : !bookmarks.data?.some((bookmark) => bookmark.events) ? (
          <p>No published bookmarks yet.</p>
        ) : (
          <ul>
            {bookmarks.data.map(
              ({ events: event }) =>
                event && (
                  <li className="notice" key={event.id}>
                    <Link href={`/events/${event.slug}`}>{event.title}</Link>
                  </li>
                ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
