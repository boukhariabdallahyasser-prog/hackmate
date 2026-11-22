"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/supabase/server";
import { textField, uuid, type FormState } from "@/lib/forms";

type ReviewType = "verification" | "event" | "report" | "team" | "unpublish";

export async function review(
  kind: ReviewType,
  id: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember(
    kind === "verification" || kind === "event" ? "admin" : "moderator",
  );
  const reason = textField(form, "reason");
  const decision = textField(form, "decision");
  if (
    !uuid.safeParse(id).success ||
    reason.length < 3 ||
    reason.length > 1000 ||
    ((kind === "verification" || kind === "event") &&
      !["approve", "reject"].includes(decision))
  ) {
    return { message: "Choose a decision and record a reason." };
  }
  const approved = decision === "approve";
  const result =
    kind === "verification"
      ? await client.rpc("review_verification", {
          request_id: id,
          approved,
          reason,
        })
      : kind === "event"
        ? await client.rpc("review_event", { event_id: id, approved, reason })
        : kind === "team"
          ? await client.rpc("restrict_team", { team: id, reason })
          : kind === "unpublish"
            ? await client.rpc("unpublish_event", { event: id, reason })
            : await client.rpc("close_report", { report: id, reason });
  if (result.error)
    return {
      message:
        "The decision could not be recorded. Refresh the queue and check the current status.",
    };
  revalidatePath("/staff");
  revalidatePath("/events");
  revalidatePath("/staff/events/[event]", "page");
  revalidatePath("/teams/[team]", "page");
  return { message: "Decision recorded.", success: true };
}

export async function manageCatalog(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("admin");
  const kind = textField(form, "kind");
  const name = textField(form, "name");
  const parent = uuid.safeParse(form.get("university"));
  if (
    !["university", "domain", "skill", "interest"].includes(kind) ||
    name.length < 2 ||
    name.length > (kind === "skill" || kind === "interest" ? 80 : 200) ||
    (kind === "domain" &&
      (!parent.success ||
        !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(name)))
  ) {
    return {
      message:
        "Enter a catalog name. For an email domain, use the part after @ and choose a university.",
    };
  }
  const { error } = await client.rpc("staff_catalog", {
    kind,
    name,
    parent: parent.data ?? null,
    active: textField(form, "active") !== "disabled",
  });
  if (error) return { message: "This catalog item could not be saved." };
  revalidatePath("/staff");
  return { message: "Catalog updated.", success: true };
}

export async function manageAccount(
  id: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("admin");
  const decision = textField(form, "decision");
  const status = ["unverified", "suspended"].includes(decision)
    ? decision
    : null;
  const role = ["student", "moderator", "admin"].includes(decision)
    ? decision
    : null;
  if (!uuid.safeParse(id).success || (!status && !role))
    return { message: "Choose a permitted account action." };
  const { error } = await client.rpc("staff_account", {
    member: id,
    status,
    role,
  });
  if (error)
    return {
      message: "Your role cannot perform this change for the selected account.",
    };
  revalidatePath("/staff");
  return { message: "Account updated.", success: true };
}

export async function saveAnnouncement(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("admin");
  const message = textField(form, "message");
  if (message.length > 500)
    return { message: "Keep the announcement within 500 characters." };
  const { error } = await client.rpc("save_announcement", { message });
  if (error) return { message: "The announcement could not be saved." };
  revalidatePath("/staff");
  revalidatePath("/account");
  return { message: "Announcement updated.", success: true };
}
