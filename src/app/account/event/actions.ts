"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categories, formats, isCategory, isFormat } from "@/lib/events";
import {
  httpsUrl,
  optionalText,
  textField,
  uuid,
  type FormState,
} from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

function localDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+01:00`);
  if (Number.isNaN(date.getTime())) return null;
  const algeria = new Date(date.getTime() + 3600000).toISOString().slice(0, 16);
  return algeria === value ? date.toISOString() : null;
}

export async function submitEvent(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("verified");
  const title = textField(form, "title");
  const description = textField(form, "description");
  const organizer = textField(form, "organizer");
  const category = textField(form, "category");
  const format = textField(form, "format");
  const rawDeadline = optionalText(form, "registration_deadline");
  const starts = localDate(optionalText(form, "starts_at"));
  const ends = localDate(optionalText(form, "ends_at"));
  const deadline = localDate(rawDeadline);
  const min = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(textField(form, "min_team_size"));
  const max = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(textField(form, "max_team_size"));
  const skills = z.array(uuid).max(30).safeParse(form.getAll("skills"));
  if (
    title.length < 3 ||
    title.length > 160 ||
    description.length < 10 ||
    description.length > 12000 ||
    organizer.length < 2 ||
    organizer.length > 120 ||
    !isCategory(category) ||
    !isFormat(format) ||
    !starts ||
    !ends ||
    ends < starts ||
    (rawDeadline && !deadline) ||
    (deadline && deadline > starts) ||
    !min.success ||
    !max.success ||
    max.data < min.data ||
    !skills.success
  ) {
    return {
      message:
        "Check the title, description, organizer, dates, team sizes, and chosen skills.",
    };
  }
  const rawLinks = [
    "source_url",
    "registration_url",
    "official_url",
    "cover_path",
  ] as const;
  const links = {
    source_url: null,
    registration_url: null,
    official_url: null,
    cover_path: null,
  } as Record<(typeof rawLinks)[number], string | null>;
  for (const field of rawLinks) {
    const value = optionalText(form, field);
    const url = httpsUrl(value);
    if (value && (!url || value.length > 500))
      return { message: "Use valid HTTPS links with at most 500 characters." };
    links[field] = url;
  }
  if (!links.source_url)
    return {
      message:
        "Add a public HTTPS source that staff can use to verify the event.",
    };
  const location = optionalText(form, "location");
  const eligibility = optionalText(form, "eligibility");
  const prizes = optionalText(form, "prizes");
  if (
    (location?.length ?? 0) > 160 ||
    (eligibility?.length ?? 0) > 2000 ||
    (prizes?.length ?? 0) > 2000
  )
    return {
      message: "Shorten the location, eligibility or prize information.",
    };

  const titleSlug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 120)
    .replace(/^-|-$/g, "");
  const slug = `${titleSlug || "event"}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await client.rpc("submit_event", {
    details: {
      title,
      slug,
      description,
      organizer,
      category,
      format,
      starts_at: starts,
      ends_at: ends,
      registration_deadline: deadline,
      location,
      eligibility,
      prizes,
      min_team_size: min.data,
      max_team_size: max.data,
      ...links,
    },
    skills: skills.data,
  });
  if (error)
    return {
      message:
        "The event could not be submitted. Check the details and try again.",
    };
  revalidatePath("/account/submissions");
  return {
    message: `${categories[category]} · ${formats[format]} — event submitted for staff review.`,
    success: true,
  };
}

export async function saveBookmark(
  event: string,
  previouslySaved: boolean,
  _: FormState,
  __: FormData,
): Promise<FormState> {
  void _;
  void __;
  const { client, id } = await requireMember("verified");
  if (!uuid.safeParse(event).success)
    return { message: "This event is unavailable." };
  const { error } = previouslySaved
    ? await client
        .from("event_bookmarks")
        .delete()
        .eq("event_id", event)
        .eq("user_id", id)
    : await client.from("event_bookmarks").insert({ event_id: event });
  if (error && error.code !== "23505")
    return { message: "The bookmark could not be updated." };
  revalidatePath("/account/submissions");
  revalidatePath("/account");
  revalidatePath("/account/saved");
  revalidatePath("/events/[slug]", "page");
  return {
    message: previouslySaved ? "Bookmark removed." : "Event bookmarked.",
    success: true,
  };
}

export async function reportItem(
  kind: "event" | "team",
  target: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client, id } = await requireMember("verified");
  const reason = textField(form, "reason");
  if (
    !uuid.safeParse(target).success ||
    reason.length < 10 ||
    reason.length > 1000
  ) {
    return { message: "Explain the issue in 10–1000 characters." };
  }
  const { error } = await client.from("reports").insert({
    reporter_id: id,
    event_id: kind === "event" ? target : null,
    team_id: kind === "team" ? target : null,
    reason,
  });
  if (error) return { message: "This report could not be submitted." };
  revalidatePath("/staff");
  return { message: "Report sent to the moderation team.", success: true };
}
