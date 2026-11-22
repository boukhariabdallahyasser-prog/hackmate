import { createServer } from "node:http";

const baseDate = new Date();
function fromToday(days) {
  return new Date(
    baseDate.getTime() + days * 24 * 60 * 60 * 1000,
  ).toISOString();
}

const events = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "fixture-hackathon",
    title: "Fixture Hackathon",
    category: "hackathon",
    description:
      "This event is only present in the automated test environment.",
    organizer: "Test organizer",
    starts_at: fromToday(10),
    ends_at: fromToday(11),
    format: "online",
    source_status: "community",
    moderation_status: "approved",
    source_url: "https://example.com/event",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "pending-fixture",
    title: "Pending Fixture",
    category: "hackathon",
    moderation_status: "pending",
  },
];

events.push(
  {
    ...events[0],
    id: "00000000-0000-0000-0000-000000000003",
    slug: "fixture-hackathon-finals",
    title: "Fixture Hackathon: Finals",
    starts_at: fromToday(30),
    ends_at: fromToday(31),
  },
  {
    ...events[0],
    id: "00000000-0000-0000-0000-000000000004",
    slug: "fixture-hackathon-offline",
    title: "Fixture Hackathon: In Person",
    format: "offline",
  },
  {
    ...events[0],
    id: "00000000-0000-0000-0000-000000000005",
    slug: "past-event",
    title: "Past Event",
    category: "workshop",
    starts_at: fromToday(-3),
    ends_at: fromToday(-2),
  },
);

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:3101");
  if (url.pathname === "/health") return response.end("ready");
  if (url.pathname !== "/rest/v1/events" || request.method !== "GET") {
    response.writeHead(404).end();
    return;
  }

  const filters = ["category", "slug", "moderation_status", "format"];
  const title = url.searchParams.get("title");
  const titlePattern = title?.startsWith("imatch.")
    ? new RegExp(title.slice(7), "i")
    : null;
  const start = url.searchParams.get("starts_at");
  const startsAfter = start?.startsWith("gte.") ? start.slice(4) : "";
  const exclude = url.searchParams.get("id");
  const rows = events.filter(
    (event) =>
      filters.every((field) => {
        const filter = url.searchParams.get(field);
        return !filter || filter === `eq.${event[field]}`;
      }) &&
      (!titlePattern || titlePattern.test(event.title)) &&
      (!startsAfter || (event.starts_at ?? "") >= startsAfter) &&
      (!exclude || exclude !== `neq.${event.id}`),
  );
  const latest = url.searchParams.get("order")?.startsWith("starts_at.desc");
  rows.sort((a, b) => {
    const dateOrder = (a.starts_at ?? "").localeCompare(b.starts_at ?? "");
    return (latest ? -dateOrder : dateOrder) || a.id.localeCompare(b.id);
  });
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? rows.length);
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(rows.slice(offset, offset + limit)));
}).listen(3101, "127.0.0.1");
