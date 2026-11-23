import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { CredentialFields } from "@/components/credential-fields";
import { requireMember } from "@/lib/supabase/server";
import { recover, register, resetPassword, signIn, signOut } from "../actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Compass, ShieldCheck, UsersRound } from "lucide-react";

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
    <section className="shell auth-layout">
      <div className="auth-story">
        <Link href="/" className="auth-back"><ArrowLeft size={17} aria-hidden="true" /> Back to HackMate</Link>
        <span className="auth-story-label">BUILT FOR STUDENT BUILDERS</span>
        <h2>Your next collaboration starts here<span>.</span></h2>
        <p>One place to discover opportunities, connect with students, and build something that matters.</p>
        <div className="auth-benefits">
          <span><Compass size={19} aria-hidden="true" /> Discover curated tech events</span>
          <span><UsersRound size={19} aria-hidden="true" /> Connect with future teammates</span>
          <span><ShieldCheck size={19} aria-hidden="true" /> University-based accounts</span>
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-card">
          <span className="section-kicker">WELCOME TO HACKMATE</span>
          <h1>{details.title}</h1>
          {screen === "register" ? (
            <p className="auth-description"><CheckCircle2 size={17} aria-hidden="true" /> Use your university email. An administrator reviews your account after email confirmation.</p>
          ) : (
            <p className="auth-description">Your space to discover events and collaborate with students across Algeria.</p>
          )}
          <ActionForm action={details.action} submit={details.submit}>
            <CredentialFields screen={screen} />
          </ActionForm>
          <div className="text-links auth-links">
            {screen !== "sign-in" && <Link href="/auth/sign-in">Sign in</Link>}
            {screen !== "register" && <Link href="/auth/register">Create an account</Link>}
            {screen !== "recover" && <Link href="/auth/recover">Forgot your password?</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
