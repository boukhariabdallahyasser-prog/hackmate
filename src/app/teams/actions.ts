"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/supabase/server";
import { textField, uuid, type FormState } from "@/lib/forms";

export async function saveTeam(
  teamId: string | null,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("verified");
  const event = uuid.safeParse(form.get("event"));
  const capacity = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(form.get("capacity"));
  const name = textField(form, "name");
  const description = textField(form, "description");
  const positions = textField(form, "positions");
  const skills = z.array(uuid).max(30).safeParse(form.getAll("skills"));
  if (
    (!teamId && (!event.success || !capacity.success)) ||
    (teamId && !uuid.safeParse(teamId).success) ||
    name.length < 2 ||
    name.length > 100 ||
    description.length < 5 ||
    description.length > 4000 ||
    positions.length > 1500 ||
    !skills.success
  ) {
    return {
      message: "Check the event, team name, description, capacity, and skills.",
    };
  }
  const { data, error } = await client.rpc("save_team", {
    team: teamId,
    event: event.data ?? null,
    capacity: capacity.data ?? 1,
    title: name,
    description,
    positions,
    recruiting: form.get("recruiting") === "on",
    private_team: form.get("private_team") === "on",
    skills: skills.data,
  });
  if (error || !data)
    return {
      message:
        error?.code === "23505"
          ? "That team name is taken for this event."
          : "The team could not be saved. Check the event’s team size limits.",
    };
  revalidatePath("/teams");
  if (!teamId) redirect(`/teams/${data}`);
  revalidatePath(`/teams/${teamId}`);
  return { message: "Team updated.", success: true };
}

export async function applyToTeam(
  team: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("verified");
  const message = textField(form, "message");
  if (!uuid.safeParse(team).success || !message || message.length > 2000)
    return { message: "Add a short message explaining how you can help." };
  const { error } = await client
    .from("team_applications")
    .insert({ team_id: team, message });
  if (error)
    return {
      message:
        error.code === "23505"
          ? "You have already applied to this team."
          : "This team is not accepting applications from your account.",
    };
  revalidatePath(`/teams/${team}`);
  return { message: "Join request sent.", success: true };
}

type TeamAction =
  "application" | "invite" | "invitation" | "membership" | "cancel-invitation";

export async function updateTeam(
  action: TeamAction,
  target: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireMember("verified");
  if (!uuid.safeParse(target).success)
    return { message: "This item is unavailable." };
  const decision = textField(form, "decision");
  const member = uuid.safeParse(form.get("member"));
  const recipient = uuid.safeParse(form.get("recipient"));
  let result;
  switch (action) {
    case "application":
      if (decision !== "accept" && decision !== "reject")
        return { message: "Choose a decision." };
      result = await client.rpc("review_application", {
        application_id: target,
        accept: decision === "accept",
      });
      break;
    case "invitation":
      if (decision !== "accept" && decision !== "reject")
        return { message: "Choose a decision." };
      result = await client.rpc("respond_invitation", {
        invitation: target,
        accept: decision === "accept",
      });
      break;
    case "invite":
      if (!recipient.success) return { message: "Choose a verified teammate." };
      result = await client.rpc("invite_member", {
        team: target,
        recipient: recipient.data,
      });
      break;
    case "membership":
      if (!member.success || (decision !== "transfer" && decision !== "remove"))
        return { message: "Choose a member and an action." };
      result = await client.rpc("manage_member", {
        team: target,
        member: member.data,
        transfer: decision === "transfer",
      });
      break;
    case "cancel-invitation":
      result = await client.rpc("cancel_invitation", { invitation: target });
      revalidatePath("/staff");
      break;
  }
  if (result.error)
    return {
      message:
        result.error.message === "Team full"
          ? "This team has reached its member limit."
          : "This action could not be completed. It may already have been processed.",
    };
  revalidatePath("/teams");
  revalidatePath("/teams/[team]", "page");
  return {
    message: action === "invite" ? "Invitation sent." : "Team status updated.",
    success: true,
  };
}
