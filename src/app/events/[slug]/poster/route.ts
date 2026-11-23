import { getEvent } from "@/lib/events";
import { posterSvg } from "@/lib/event-poster";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getEvent(slug);
  if (result.status !== "found") {
    return new Response("No public event poster", {
      status: result.status === "missing" ? 404 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { event } = result;
  return new Response(posterSvg({
    slug: event.slug,
    title: event.title,
    category: event.category,
    organizer: event.organizer,
  }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=900",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
