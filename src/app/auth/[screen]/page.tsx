import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { CredentialFields } from "@/components/credential-fields";
import { requireMember } from "@/lib/supabase/server";
import { recover, register, resetPassword, signIn, signOut } from "../actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Compass, ShieldCheck, UsersRound, Sparkles } from "lucide-react";

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
        <span className="auth-story-label"><Sparkles size={15} aria-hidden="true" /> THE STUDENT BUILDER NETWORK · ALGERIA</span>
        <h2>Find your people.<br /><em>Build your future.</em><span>✳</span></h2>
        <p>One account. More opportunities. Meet ambitious students, discover the right challenges, and make your next idea real.</p>
        <div className="auth-benefits">
          <span><Compass size={19} aria-hidden="true" /> Discover curated tech events</span>
          <span><UsersRound size={19} aria-hidden="true" /> Connect with future teammates</span>
          <span><ShieldCheck size={19} aria-hidden="true" /> University-based accounts</span>
        </div>
        <div className="auth-story-footer"><span>01 / DISCOVER</span><span>02 / CONNECT</span><span>03 / BUILD</span></div>
      </div>
      <div className="auth-content">
        <div className="auth-card">
          <span className="section-kicker"><span className="auth-live-dot" /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>{screen === "sign-in" ? "Welcome back." : details.title}</h1>
          {screen === "register" ? (
            <p className="auth-description"><CheckCircle2 size={17} aria-hidden="true" /> Use your university email. An administrator reviews your account after email confirmation.</p>
          ) : (
            <p className="auth-description">Your space to discover events and collaborate with students across Algeria.</p>
          )}
          <ActionForm action={details.action} submit={details.submit}>
            <CredentialFields screen={screen} />
          </ActionForm>
          <div className="auth-switch-note">{screen === "sign-in" ? "New around here?" : "Already part of HackMate?"}</div>
          <div className="text-links auth-links">
            {screen !== "sign-in" && <Link href="/auth/sign-in">Sign in</Link>}
            {screen !== "register" && <Link href="/auth/register">Join HackMate <ArrowUpRight size={15} aria-hidden="true" /></Link>}
            {screen !== "recover" && <Link href="/auth/recover">Forgot your password?</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
