const encoder = new TextEncoder();

function text(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/[;,]/g, "\\$&");
}

function fold(value: string) {
  let folded = "";
  let length = 0;
  for (const character of value) {
    const bytes = encoder.encode(character).byteLength;
    if (length + bytes > 75) {
      folded += "\r\n ";
      length = 1;
    }
    folded += character;
    length += bytes;
  }
  return folded;
}

function utc(value: string | Date) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function eventCalendar(
  event: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    location: string | null;
    description: string;
    registration_deadline: string | null;
  },
  now = new Date(),
) {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HackMate//Student Events//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${text(event.id)}@hackmate`,
      `DTSTAMP:${utc(now)}`,
      `DTSTART:${utc(event.starts_at)}`,
      ...(event.ends_at !== event.starts_at
        ? [`DTEND:${utc(event.ends_at)}`]
        : []),
      `SUMMARY:${text(event.title)}`,
      ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
      `DESCRIPTION:${text(event.description)}`,
      "END:VEVENT",
      ...(event.registration_deadline
        ? [
            "BEGIN:VEVENT",
            `UID:${text(event.id)}-registration@hackmate`,
            `DTSTAMP:${utc(now)}`,
            `DTSTART:${utc(event.registration_deadline)}`,
            `SUMMARY:${text("Registration deadline · " + event.title)}`,
            "END:VEVENT",
          ]
        : []),
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}

export function algeriaDateStart(date: unknown) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return null;
  const parsed = new Date(date + "T00:00:00.000Z");
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    return null;
  return new Date(parsed.getTime() - 60 * 60 * 1000);
}
