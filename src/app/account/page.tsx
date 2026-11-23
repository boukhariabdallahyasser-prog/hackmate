import { ArrowUpRight, Bookmark, CalendarDays, Clock3, MapPin, Plus, Sparkles, UsersRound, Compass } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { eventDate, formats, isFormat, listEvents } from "@/lib/events";
import { requireMember } from "@/lib/supabase/server";

export default async function AccountPage() {
  const { client, id, access } = await requireMember();
  const admin = access?.role === "admin" || access?.role === "super_admin";
  if (admin && access?.status === "verified") redirect("/staff");
  if (
    access?.status === "verified" &&
    access.role === "student" &&
    !access.onboarded_at
  )
    redirect("/account/onboarding");

  if (access?.status !== "verified") {
    const { data: request, error } = await client
      .from("student_approvals")
      .select("status,review_reason")
      .eq("user_id", id)
      .maybeSingle();
    return (
      <section className="onboarding-panel approval-panel">
        <Clock3 size={26} aria-hidden="true" />
        <h1>
          {request?.status === "rejected"
            ? "Account not approved"
            : "Student approval"}
        </h1>
        {error ? (
          <p role="alert">
            We couldn’t load your approval status. Try again in a moment.
          </p>
        ) : request?.status === "rejected" ? (
          <p>{request.review_reason ?? "Your request was declined."}</p>
        ) : request?.status === "pending" ? (
          <p>
            Your university email is confirmed. An administrator has been
            notified. Sign in again after your account is approved.
          </p>
        ) : (
          <p>Confirm your university email to send your account for review.</p>
        )}
        <form action={signOut}>
          <Button>Sign out</Button>
        </form>
      </section>
    );
  }

  const [{ data: profile }, { data: announcement }, savedCount, results] =
    await Promise.all([
      client.from("profiles").select("full_name").eq("id", id).maybeSingle(),
      client
        .from("platform_settings")
        .select("value")
        .eq("key", "announcement")
        .maybeSingle(),
      client
        .from("event_bookmarks")
        .select("event_id", { count: "exact", head: true })
        .eq("user_id", id),
      listEvents({
        search: "",
        latestFirst: false,
        page: 1,
        upcomingOnly: true,
      }),
    ]);
  return (
    <section className="student-dashboard">
      <header className="dashboard-title">
        <div>
          <span className="dashboard-eyebrow"><Sparkles size={15} aria-hidden="true" /> YOUR STUDENT WORKSPACE</span>
          <h1>Your next big thing<br /><em>starts here.</em></h1>
          <p>
            {profile
              ? `Welcome back, ${profile.full_name}. Ready to build something?`
              : "Discover what’s next for student builders across Algeria."}
          </p>
        </div>
        <Button asChild>
          <Link href="/account/event">
            <Plus size={17} aria-hidden="true" />
            Suggest an event
          </Link>
        </Button>
      </header>
      {announcement?.value && <p className="notice">{announcement.value}</p>}
      <div className="dashboard-quicklinks">
        <Link href="/events?upcoming=1" className="dashboard-quicklink"><Compass size={22} aria-hidden="true" /><span><strong>Explore events</strong><small>Find your next challenge</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link>
        <Link href="/teams" className="dashboard-quicklink"><UsersRound size={22} aria-hidden="true" /><span><strong>Find your team</strong><small>Build with other students</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
      <Link href="/account/saved" className="dashboard-saved-link">
        <Bookmark size={21} aria-hidden="true" />
        <span><strong>My saved events</strong><small>Plan your next opportunity and keep private notes</small></span>
        <span className="dashboard-saved-count">{savedCount.error ? "View" : `${savedCount.count ?? 0} saved`}</span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
      <div className="dashboard-section-head"><div><span className="dashboard-eyebrow">ON YOUR RADAR</span><h2>Upcoming opportunities</h2></div><Link href="/events?upcoming=1">View all <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      {!results.ok ? (
        <p className="notice" role="alert">
          Upcoming events are temporarily unavailable.
        </p>
      ) : !results.events.length ? (
        <div className="dashboard-empty">
          <CalendarDays size={30} aria-hidden="true" />
          <h2>No upcoming events yet</h2>
          <p>Approved events will appear here as they’re announced.</p>
        </div>
      ) : (
        <ul className="dashboard-events">
          {results.events.map((event) => (
            <li key={event.id}>
              <Link href={`/events/${event.slug}`} className="dashboard-event">
                <CalendarDays aria-hidden="true" size={21} />
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.organizer}</p>
                  <time dateTime={event.starts_at}>
                    {eventDate(event.starts_at)}
                  </time>
                </div>
                <span className="dashboard-location">
                  <MapPin size={16} aria-hidden="true" />
                  {event.location ??
                    (isFormat(event.format)
                      ? formats[event.format]
                      : event.format)}
                </span>
                <ArrowUpRight aria-hidden="true" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/events?upcoming=1" className="underlined">
        Browse all upcoming events
      </Link>
      <form action={signOut}>
        <button className="underlined" type="submit">
          Sign out
        </button>
      </form>
    </section>
  );
}
