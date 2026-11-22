"use server";

import { revalidatePath } from "next/cache";
import { uuid, type FormState } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

export async function toggleEventInterest(
  event: string,
  interested: boolean,
): Promise<FormState> {
  const { client, id } = await requireMember("verified");
  if (!uuid.safeParse(event).success)
    return { message: "This event is unavailable." };
  const { error } = interested
    ? await client
        .from("profile_event_interests")
        .delete()
        .eq("profile_id", id)
        .eq("event_id", event)
    : await client.from("profile_event_interests").insert({ event_id: event });
  if (error && error.code !== "23505")
    return { message: "Your event interest could not be updated." };
  revalidatePath("/community");
  return {
    message: interested
      ? "Interest removed."
      : "Your interest is visible to verified students who can view your profile.",
    success: true,
  };
}
