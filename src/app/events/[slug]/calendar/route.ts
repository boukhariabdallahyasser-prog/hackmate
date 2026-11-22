import { eventCalendar } from "@/lib/event-calendar";
import { getEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const result = await getEvent((await params).slug);
  if (result.status === "missing")
    return new Response("Event not found", { status: 404 });
  if (result.status === "unavailable")
    return new Response("Event temporarily unavailable", { status: 503 });
  return new Response(eventCalendar(result.event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.event.slug}.ics"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
