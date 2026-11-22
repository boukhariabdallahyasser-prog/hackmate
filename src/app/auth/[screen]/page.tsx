import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { CredentialFields } from "@/components/credential-fields";
import { requireMember } from "@/lib/supabase/server";
import { recover, register, resetPassword, signIn, signOut } from "../actions";
import { Button } from "@/components/ui/button";

const screens = {
  "sign-in": {
    title: "Sign in to HackMate",
    submit: "Sign in",
    action: signIn,
  },
  register: {
    title: "Create your student account",
    submit: "Create account",
    action: register,
  },
  recover: {
    title: "Recover your password",
    submit: "Send reset link",
    action: recover,
  },
  reset: {
    title: "Set a new password",
    submit: "Change password",
    action: resetPassword,
  },
};

export const metadata = { title: "Student account", robots: { index: false } };

export default async function AuthPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (screen === "suspended")
    return (
      <section className="shell section form-page">
        <h1>Account suspended</h1>
        <p>Contact HackMate staff if you believe this was an error.</p>
        <form action={signOut}>
          <Button>Sign out</Button>
        </form>
      </section>
    );
  if (!Object.hasOwn(screens, screen)) notFound();
  if (screen === "reset") await requireMember();
  const details = screens[screen as keyof typeof screens];
  return (
    <section className="shell section form-page">
      <h1>{details.title}</h1>
      {screen === "register" && (
        <p>
          Use your university email. You can request student verification after
          confirming your address.
        </p>
      )}
      <ActionForm action={details.action} submit={details.submit}>
        <CredentialFields screen={screen} />
      </ActionForm>
      <div className="text-links">
        {screen !== "sign-in" && <Link href="/auth/sign-in">Sign in</Link>}
        {screen !== "register" && (
          <Link href="/auth/register">Create an account</Link>
        )}
        {screen !== "recover" && (
          <Link href="/auth/recover">Forgot your password?</Link>
        )}
      </div>
    </section>
  );
}
