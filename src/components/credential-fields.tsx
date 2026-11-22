"use client";

import { useForm } from "react-hook-form";
import { email, password } from "@/lib/forms";

export function CredentialFields({ screen }: { screen: string }) {
  const {
    register,
    formState: { errors },
  } = useForm<{ email: string; password: string; confirmation: string }>({
    mode: "onBlur",
  });
  return (
    <>
      {screen !== "reset" && (
        <label>
          University email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              validate: (value) =>
                email.safeParse(value.trim()).success ||
                "Enter a valid email address.",
            })}
          />
          {errors.email && <span id="email-error">{errors.email.message}</span>}
        </label>
      )}
      {screen !== "recover" && (
        <label>
          {screen === "reset" ? "New password" : "Password"}
          <input
            type="password"
            autoComplete={
              screen === "sign-in" ? "current-password" : "new-password"
            }
            minLength={screen === "sign-in" ? undefined : 10}
            maxLength={128}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              validate: (value) =>
                screen === "sign-in" ||
                password.safeParse(value).success ||
                "Use at least 10 characters.",
            })}
          />
          {errors.password && (
            <span id="password-error">{errors.password.message}</span>
          )}
        </label>
      )}
      {screen === "reset" && (
        <label>
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
            {...register("confirmation")}
          />
        </label>
      )}
    </>
  );
}
