"use server";

import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { email, password, textField, type FormState } from "@/lib/forms";

function callback(recovery = false) {
  const url = new URL(
    "/auth/confirm",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  if (recovery) url.searchParams.set("flow", "recovery");
  return url.href;
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const address = email.safeParse(textField(form, "email"));
  const secret = form.get("password");
  if (
    !address.success ||
    typeof secret !== "string" ||
    !secret ||
    secret.length > 128
  )
    return { message: "Enter your university email and password." };
  const client = await serverClient();
  if (!client) return { message: "Sign-in is temporarily unavailable." };
  const { error } = await client.auth.signInWithPassword({
    email: address.data,
    password: secret,
  });
  if (error)
    return {
      message:
        "Sign-in failed. Check your credentials and confirm your university email.",
    };
  redirect("/account");
}

export async function register(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const address = email.safeParse(textField(form, "email"));
  const secret = password.safeParse(form.get("password"));
  if (!address.success || !secret.success)
    return {
      message: "Use a university email and a password of 10–128 characters.",
    };
  const client = await serverClient();
  if (!client)
    return {
      message:
        "Registration cannot connect to Supabase on this deployment. Please contact the site administrator.",
    };
  const { data: domain, error: lookupError } = await client
    .from("university_email_domains")
    .select("id")
    .eq("domain", address.data.split("@")[1])
    .maybeSingle();
  if (lookupError)
    return {
      message: "University email eligibility is temporarily unavailable.",
    };
  if (!domain)
    return {
      message:
        "This university email domain is not on HackMate’s approved list.",
    };

  const { error } = await client.auth.signUp({
    email: address.data,
    password: secret.data,
    options: { emailRedirectTo: callback() },
  });
  if (error)
    return { message: "Registration could not be completed. Try again later." };
  return {
    message:
      "Check your university inbox to confirm your email. An administrator will then review your account.",
    success: true,
  };
}

export async function recover(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const address = email.safeParse(textField(form, "email"));
  if (!address.success) return { message: "Enter a valid university email." };
  const client = await serverClient();
  if (!client)
    return { message: "Password recovery is temporarily unavailable." };
  await client.auth.resetPasswordForEmail(address.data, {
    redirectTo: callback(true),
  });
  return {
    message: "If your account exists, check your inbox for a reset link.",
    success: true,
  };
}

export async function resetPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const secret = password.safeParse(form.get("password"));
  if (!secret.success)
    return { message: "Use a password of 10–128 characters." };
  if (secret.data !== form.get("confirmation"))
    return { message: "The passwords do not match." };
  const client = await serverClient();
  if (!client) return { message: "Password reset is temporarily unavailable." };
  const { error } = await client.auth.updateUser({ password: secret.data });
  if (error)
    return {
      message:
        "The password could not be changed. Request a fresh link if yours expired.",
    };
  redirect("/account");
}

export async function signOut() {
  const client = await serverClient();
  await client?.auth.signOut({ scope: "local" });
  redirect("/auth/sign-in");
}
