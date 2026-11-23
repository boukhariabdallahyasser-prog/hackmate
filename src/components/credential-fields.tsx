"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { email, password } from "@/lib/forms";

export function CredentialFields({ screen }: { screen: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
        <div className="credential-field">
          <label htmlFor="account-password">{screen === "reset" ? "New password" : "Password"}</label>
          <div className="credential-password-wrap">
            <input
              id="account-password"
              type={showPassword ? "text" : "password"}
              autoComplete={screen === "sign-in" ? "current-password" : "new-password"}
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
            <button type="button" className="credential-visibility" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
            </button>
          </div>
          {errors.password && <span id="password-error" role="alert">{errors.password.message}</span>}
          {screen !== "sign-in" && <small className="credential-hint">Use at least 10 characters.</small>}
        </div>
      )}
      {screen === "reset" && (
        <div className="credential-field">
          <label htmlFor="account-confirmation">Confirm new password</label>
          <div className="credential-password-wrap">
            <input id="account-confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" required maxLength={128} {...register("confirmation")} />
            <button type="button" className="credential-visibility" aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmation} onClick={() => setShowConfirmation((value) => !value)}>
              {showConfirmation ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
