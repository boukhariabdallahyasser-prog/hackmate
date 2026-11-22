import { z } from "zod";

export const uuid = z.uuid();
export const password = z.string().min(10).max(128);
export const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

export function textField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(form: FormData, name: string) {
  return textField(form, name) || null;
}

export function httpsUrl(value: string | null) {
  if (!value) return null;
  const url = URL.canParse(value) ? new URL(value) : null;
  return url?.protocol === "https:" && !url.username && !url.password
    ? url.href
    : null;
}

export type FormState = { message: string; success?: boolean };
