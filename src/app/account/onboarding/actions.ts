"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { textField, uuid, type FormState } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

export async function completeOnboarding(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client, access } = await requireMember();
  if (access?.status !== "verified") redirect("/account");
  const input = z
    .object({
      name: z.string().min(2).max(120),
      handle: z.string().regex(/^[a-z0-9_]{3,30}$/),
      field: z.string().min(2).max(100),
      selected_interests: z.array(uuid).min(1).max(8),
    })
    .safeParse({
      name: textField(form, "name"),
      handle: textField(form, "handle").toLowerCase(),
      field: textField(form, "field"),
      selected_interests: form.getAll("interests"),
    });
  if (!input.success)
    return {
      message:
        "Add your name, a username, a specialization, and at least one interest.",
    };
  const { error } = await client.rpc("complete_student_onboarding", input.data);
  if (error)
    return {
      message:
        error.code === "23505"
          ? "That username is already taken."
          : "Your preferences could not be saved. Try again.",
    };
  redirect("/account");
}
