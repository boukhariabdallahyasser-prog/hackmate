import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Compass,
  LockKeyhole,
  UsersRound,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { CredentialFields } from "@/components/credential-fields";
import { requireMember } from "@/lib/supabase/server";
import { recover, register, resetPassword, signIn, signOut } from "../actions";
import { Button } from "@/components/ui/button";

const screens = {
  "sign-in": {
    title: "Sign in to HackMate",
    submit: "Sign in",
    subtitle: "Welcome back. Your next collaboration is one click closer.",
    action: signIn,
  },
  register: {
    title: "Create your student account",
    submit: "Create account",
    subtitle:
      "Join with your university email. Student accounts are reviewed before access to team features.",
    action: register,
  },
  recover: {
    title: "Recover your password",
    submit: "Send reset link",
    subtitle: "Enter your university email and we’ll send recovery instructions if you have an account.",
    action: recover,
  },
  reset: {
    title: "Set a new password",
    submit: "Change password",
    subtitle: "Choose a strong new password to get back into your account.",
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
      <aside className="auth-showcase">
        <div className="auth-showcase-pattern" aria-hidden="true" />
        <span className="auth-showcase-label"><Compass size={17} aria-hidden="true" /> FIND YOUR PEOPLE</span>
        <div className="auth-showcase-copy">
          <p>Good ideas grow with <span>great teammates.</span></p>
          <small>One place for student tech events, real connections, and the teams behind the next big thing.</small>
        </div>
        <div className="auth-trust-list">
          <span><Compass size={18} aria-hidden="true" /> Discover events</span>
          <span><BadgeCheck size={18} aria-hidden="true" /> Verified student community</span>
          <span><UsersRound size={18} aria-hidden="true" /> Build together</span>
        </div>
      </aside>
      <div className="auth-main">
        <Link className="auth-back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
        <div className="auth-card">
          <div className="auth-symbol"><LockKeyhole size={25} aria-hidden="true" /></div>
          <p className="section-overline">YOUR HACKMATE ACCOUNT</p>
          <h1>{details.title}</h1>
          <p className="auth-description">{details.subtitle}</p>
          <ActionForm action={details.action} submit={details.submit}>
            <CredentialFields screen={screen} />
          </ActionForm>
          <div className="auth-links">
            {screen === "sign-in" ? (
              <>
                <p>New to HackMate? <Link href="/auth/register">Create an account <ArrowUpRight size={14} aria-hidden="true" /></Link></p>
                <Link href="/auth/recover">Forgot your password?</Link>
              </>
            ) : (
              <>
                <p>Already have an account? <Link href="/auth/sign-in">Sign in <ArrowUpRight size={14} aria-hidden="true" /></Link></p>
                {screen === "reset" && <Link href="/auth/recover">Request a new recovery link</Link>}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
