"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

export function ActionForm({
  action,
  children,
  submit,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children?: ReactNode;
  submit: string;
}) {
  const [state, dispatch, pending] = useActionState(action, { message: "" });
  return (
    <form action={dispatch} className="form-stack">
      <fieldset disabled={pending}>
        {children}
        <Button type="submit">{pending ? "Saving…" : submit}</Button>
      </fieldset>
      <p role={state.success ? "status" : "alert"} hidden={!state.message}>
        {state.message}
      </p>
    </form>
  );
}
