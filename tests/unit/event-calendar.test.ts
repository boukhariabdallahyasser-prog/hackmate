import { expect, test } from "vitest";
import { algeriaDateStart, eventCalendar } from "@/lib/event-calendar";

test("calendar exports the event and registration deadline in UTC", () => {
  const calendar = eventCalendar(
    {
      id: "test-event",
      title: "Hackathon, Algiers",
      location: "ENSIA; Sidi Abdellah",
      starts_at: "2028-04-02T09:00:00+01:00",
      ends_at: "2028-04-02T16:00:00+01:00",
      registration_deadline: "2028-04-01T09:00:00+01:00",
      description: "Welcome\r\nEND:VEVENT\n" + "é".repeat(75),
    },
    new Date("2028-03-01T00:00:00Z"),
  );
  expect(calendar).toContain("DTSTART:20280402T080000Z\r\n");
  expect(calendar).toContain("DTSTART:20280401T080000Z\r\n");
  expect(calendar).toContain("SUMMARY:Hackathon\\, Algiers");
  expect(calendar).toContain("DESCRIPTION:Welcome\\nEND:VEVENT");
  expect(
    calendar.split("\r\n").filter((line) => line === "END:VEVENT"),
  ).toHaveLength(2);
  expect(
    calendar.split("\r\n").every((line) => Buffer.byteLength(line) <= 75),
  ).toBe(true);
});

test("date filters use midnight in Algeria and reject impossible dates", () => {
  expect(algeriaDateStart("2028-02-29")?.toISOString()).toBe(
    "2028-02-28T23:00:00.000Z",
  );
  expect(algeriaDateStart("2027-02-29")).toBeNull();
});
