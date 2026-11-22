"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  httpsUrl,
  optionalText,
  textField,
  uuid,
  type FormState,
} from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

export async function saveProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client, id, access } = await requireMember();
  const profile = z
    .object({
      username: z.string().regex(/^[a-z0-9_]{3,30}$/),
      full_name: z.string().min(2).max(120),
      bio: z.string().max(1000),
      experience: z.string().max(2000),
      availability: z.enum(["Available", "Limited", "Unavailable", ""]),
    })
    .safeParse({
      username: textField(form, "username").toLowerCase(),
      full_name: textField(form, "full_name"),
      bio: textField(form, "bio"),
      experience: textField(form, "experience"),
      availability: textField(form, "availability"),
    });
  if (!profile.success)
    return { message: "Check your name, username, and profile field lengths." };

  const links = [
    "avatar_path",
    "github_url",
    "linkedin_url",
    "portfolio_url",
  ] as const;
  const urls = {
    avatar_path: null,
    github_url: null,
    linkedin_url: null,
    portfolio_url: null,
  } as Record<(typeof links)[number], string | null>;
  for (const name of links) {
    const value = optionalText(form, name);
    const url = httpsUrl(value);
    if (value && (!url || value.length > 400))
      return {
        message:
          "Profile links must use HTTPS and contain at most 400 characters.",
      };
    urls[name] = url;
  }
  const preferred_roles = textField(form, "preferred_roles")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  if (
    preferred_roles.length > 8 ||
    preferred_roles.some((role) => role.length > 60)
  ) {
    return {
      message: "Enter up to eight preferred roles of up to 60 characters each.",
    };
  }

  const skills: Record<string, number> = {};
  for (const [field, value] of form.entries()) {
    if (!field.startsWith("skill:") || value === "") continue;
    const skill = uuid.safeParse(field.slice(6));
    const level = z.coerce.number().int().min(1).max(5).safeParse(value);
    if (!skill.success || !level.success)
      return { message: "Choose a skill level from 1 to 5." };
    skills[skill.data] = level.data;
  }
  const interests = z.array(uuid).max(30).safeParse(form.getAll("interests"));
  if (!interests.success || Object.keys(skills).length > 30)
    return { message: "Choose up to 30 skills and 30 interests." };

  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { message: "Your profile is temporarily unavailable." };
  const updates = {
    ...profile.data,
    ...urls,
    preferred_roles,
    discoverable: form.get("discoverable") === "on",
  };
  const { error } = existing
    ? await client.from("profiles").update(updates).eq("id", id)
    : await client.from("profiles").insert({ ...updates, id });
  if (error)
    return {
      message:
        error.code === "23505"
          ? "This username is already taken."
          : "Your profile could not be saved.",
    };

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/community");
  if (access?.status === "verified") {
    const { error: taxonomyError } = await client.rpc("save_profile_taxonomy", {
      skill_levels: skills,
      interests: interests.data,
    });
    if (taxonomyError)
      return {
        message:
          "Your profile was saved. Skills and interests could not be updated.",
      };
  }
  return { message: "Profile saved.", success: true };
}

function evidenceExtension(file: File, prefix: Uint8Array) {
  if (
    file.type === "application/pdf" &&
    Buffer.from(prefix).toString().startsWith("%PDF-")
  )
    return "pdf";
  if (
    file.type === "image/jpeg" &&
    prefix[0] === 255 &&
    prefix[1] === 216 &&
    prefix[2] === 255
  )
    return "jpg";
  if (
    file.type === "image/png" &&
    Buffer.from(prefix).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  return null;
}

export async function requestVerification(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client, id, access } = await requireMember();
  if (access?.status !== "unverified")
    return {
      message: "Your account cannot request verification at this time.",
    };
  const academicYear = textField(form, "academic_year");
  const field = textField(form, "field_of_study");
  const file = form.get("evidence");
  if (
    !academicYear ||
    academicYear.length > 40 ||
    field.length < 2 ||
    field.length > 100 ||
    !(file instanceof File) ||
    file.size < 8 ||
    file.size > 3 * 1024 * 1024
  ) {
    return {
      message:
        "Enter your academic information and attach a PDF, JPEG, or PNG up to 3 MB.",
    };
  }

  const extension = evidenceExtension(
    file,
    new Uint8Array(await file.slice(0, 8).arrayBuffer()),
  );
  if (!extension) return { message: "Choose a valid PDF, JPEG, or PNG." };
  const filename = `${id}/${crypto.randomUUID()}.${extension}`;
  const bucket = client.storage.from("verification-evidence");
  const { error: uploadError } = await bucket.upload(filename, file, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) return { message: "Your document could not be uploaded." };

  const { error } = await client.rpc("submit_verification", {
    academic_year: academicYear,
    field_of_study: field,
    evidence: filename,
  });
  if (error) {
    await bucket.remove([filename]);
    return {
      message:
        error.code === "23505"
          ? "A verification request is already pending."
          : "Submission failed. Confirm your university email and complete your profile before retrying.",
    };
  }
  revalidatePath("/account");
  revalidatePath("/account/verification");
  return {
    message:
      "Verification requested. You’ll receive a notification after staff review.",
    success: true,
  };
}

export async function markNotificationsRead() {
  const { client } = await requireMember();
  const { error } = await client.rpc("read_notifications", {});
  if (error) throw new Error("Notifications could not be updated.");
  revalidatePath("/account/notifications");
}
