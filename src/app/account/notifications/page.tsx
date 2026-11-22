import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/supabase/server";
import { eventDate } from "@/lib/events";
import { markNotificationsRead } from "../actions";

export default async function NotificationsPage() {
  const { client } = await requireMember();
  const { data, error } = await client
    .from("notifications")
    .select("id,message,destination,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <section className="form-page">
      <h1>Notifications</h1>
      {error ? (
        <p role="alert">Notifications are temporarily unavailable.</p>
      ) : !data?.length ? (
        <p>You have no notifications yet.</p>
      ) : (
        <>
          {data.some((notice) => !notice.read_at) && (
            <form action={markNotificationsRead}>
              <Button>Mark all as read</Button>
            </form>
          )}
          <ul className="card-list">
            {data.map((notice) => (
              <li className="notice" key={notice.id}>
                <Link href={notice.destination}>{notice.message}</Link>
                <p className="meta">
                  {!notice.read_at && "Unread · "}
                  {eventDate(notice.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
