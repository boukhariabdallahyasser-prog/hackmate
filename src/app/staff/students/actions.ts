"use server";

import { revalidatePath } from "next/cache";
import { textField, uuid, type FormState } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

export async function reviewStudent(
  member: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("admin");
  const decision = textField(form, "decision");
  const reason = textField(form, "reason");
  if (
    !uuid.safeParse(member).success ||
    !["approve", "reject"].includes(decision) ||
    reason.length < 3 ||
    reason.length > 1000
  )
    return {
      message: "Choose a decision and enter a reason of 3–1000 characters.",
    };
  const { error } = await client.rpc("review_student", {
    member,
    approved: decision === "approve",
    reason,
  });
  if (error)
    return {
      message:
        "This request could not be updated. Refresh the queue to check its status.",
    };
  revalidatePath("/staff");
  revalidatePath("/staff/students");
  return { message: "Student review saved.", success: true };
}
