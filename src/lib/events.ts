import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const categories = {
  hackathon: "Hackathons",
  coding: "Coding competitions",
  ctf: "Capture the Flag competitions",
  ai: "AI challenges",
  robotics: "Robotics competitions",
  startup: "Startup competitions",
  workshop: "Workshops",
  conference: "Technology conferences",
  summer_school: "Summer schools",
};

export function isCategory(value: unknown): value is keyof typeof categories {
  return typeof value === "string" && Object.hasOwn(categories, value);
}

export const formats = {
  online: "Online",
  offline: "In person",
  hybrid: "Hybrid",
};

export function isFormat(value: unknown): value is keyof typeof formats {
  return typeof value === "string" && Object.hasOwn(formats, value);
}

export const searchLimit = 100;

const columns =
  "id,slug,title,category,organizer,starts_at,location,format,source_status,registration_deadline,registration_url";
export const pageSize = 12;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function literalSearch(value: string) {
  // Escape PostgreSQL regex operators so search treats punctuation literally.
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listEvents({
  category,
  format,
  search,
  latestFirst,
  upcomingOnly,
  openRegistration,
  location,
  from,
  until,
  page,
}: {
  category?: keyof typeof categories;
  format?: keyof typeof formats;
  search: string;
  latestFirst: boolean;
  upcomingOnly?: boolean;
  openRegistration?: boolean;
  location?: string;
  from?: Date | null;
  until?: Date | null;
  page: number;
}) {
  const supabase = publicClient();
  if (!supabase) return { ok: false } as const;

  const offset = (page - 1) * pageSize;
  let query = supabase
    .from("events")
    .select(columns)
    .eq("moderation_status", "approved");
  const now = new Date().toISOString();
  if (upcomingOnly || openRegistration) query = query.gte("starts_at", now);
  if (openRegistration) {
    query = query
      .gte("registration_deadline", now)
      .not("registration_url", "is", null);
  }
  if (from) query = query.gte("starts_at", from.toISOString());
  if (until) query = query.lt("starts_at", until.toISOString());
  if (location)
    query = query.filter("location", "imatch", literalSearch(location));
  if (category) query = query.eq("category", category);
  if (format) query = query.eq("format", format);
  if (search) {
    query = query.filter("title", "imatch", literalSearch(search));
  }

  const { data, error } = await query
    .order("starts_at", { ascending: !latestFirst })
    .order("id")
    .range(offset, offset + pageSize)
    .abortSignal(AbortSignal.timeout(5000));

  if (error) {
    console.error("Published event list unavailable", { code: error.code });
    return { ok: false } as const;
  }
  return {
    ok: true,
    events: data.slice(0, pageSize),
    hasNext: data.length > pageSize,
  } as const;
}

export async function getEvent(slug: string) {
  if (slug.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { status: "missing" } as const;
  }

  const supabase = publicClient();
  if (!supabase) return { status: "unavailable" } as const;

  const { data, error } = await supabase
    .from("events")
    .select(
      `${columns}, description, ends_at, official_url, source_url, eligibility, prizes, min_team_size, max_team_size, cover_path, event_skills(skill_id)`,
    )
    .eq("moderation_status", "approved")
    .eq("slug", slug)
    .abortSignal(AbortSignal.timeout(5000))
    .maybeSingle();

  if (error) {
    console.error("Published event detail unavailable", { code: error.code });
    return { status: "unavailable" } as const;
  }
  if (!data) return { status: "missing" } as const;
  const registrationClosed = data.registration_deadline
    ? new Date(data.registration_deadline).getTime() < Date.now()
    : false;
  return { status: "found", event: data, registrationClosed } as const;
}

export async function relatedEvents(event: {
  id: string;
  category: string;
  starts_at: string;
}) {
  const supabase = publicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("id,slug,title,starts_at")
    .eq("moderation_status", "approved")
    .eq("category", event.category)
    .neq("id", event.id)
    .gte("starts_at", event.starts_at)
    .order("starts_at")
    .limit(3)
    .abortSignal(AbortSignal.timeout(3000));
  return (data ?? []).filter((related) => related.id !== event.id).slice(0, 3);
}

export async function eventSkillNames(ids: string[]) {
  if (!ids.length) return [];
  const supabase = publicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("skills")
    .select("name")
    .in("id", ids)
    .order("name")
    .abortSignal(AbortSignal.timeout(3000));
  return data?.map((skill) => skill.name) ?? [];
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat("en-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export function sourceStatus(value: string) {
  if (value === "admin_verified") return "Admin verified";
  if (value === "organizer_verified") return "Organizer verified";
  return "Community submitted";
}

export function externalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
