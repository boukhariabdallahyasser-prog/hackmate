"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { textField, uuid, type FormState } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

const plan = z.enum(["interested", "planning", "registered"]);

export async function updateSavedEvent(
  eventId: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const selected = uuid.safeParse(eventId);
  const status = plan.safeParse(textField(form, "attendance_plan"));
  const note = textField(form, "personal_note");
  if (!selected.success || !status.success || note.length > 600)
    return { message: "Choose a plan and enter a note of at most 600 characters." };

  const { client, id } = await requireMember("verified");
  const { data, error } = await client
    .from("event_bookmarks")
    .update({ attendance_plan: status.data, personal_note: note })
    .eq("event_id", selected.data)
    .eq("user_id", id)
    .select("event_id")
    .maybeSingle();

  if (error || !data)
    return {
      message:
        "Couldn't update this event. It may no longer be saved, or the database update hasn't been installed yet.",
    };

  revalidatePath("/account/saved");
  return { message: "Your private event plan was saved.", success: true };
}
