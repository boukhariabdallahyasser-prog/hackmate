import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <section className="shell section about-page">
      <header className="about-hero">
        <p className="section-overline">THE IDEA BEHIND HACKMATE</p>
        <h1>Better opportunities. <span>Better people to build with.</span></h1>
        <p>Tech events can change what you learn, who you meet, and what you build. HackMate brings student opportunities and collaboration into one focused space.</p>
        <div className="about-actions">
          <Link href="/events" className="about-primary-link">Explore events <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link href="/auth/register" className="about-secondary-link">Join as a student <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </header>
      <div className="section-heading">
        <div>
          <p className="section-overline">HOW IT WORKS</p>
          <h2>From discovery to collaboration.</h2>
          <p className="section-description">Start by exploring. Create a university-verified account when you want to participate in the student workspace.</p>
        </div>
      </div>
      <div className="about-features">
        <article>
          <span><CalendarDays size={25} aria-hidden="true" /></span>
          <p className="about-feature-number">01 · EXPLORE</p>
          <h3>See what&apos;s happening</h3>
          <p>Browse published hackathons, workshops, and tech competitions. Public listings identify where their information came from.</p>
          <Link href="/events">Browse opportunities <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </article>
        <article>
          <span><BadgeCheck size={25} aria-hidden="true" /></span>
          <p className="about-feature-number">02 · VERIFY</p>
          <h3>Join the student space</h3>
          <p>Use an approved university email address. Students confirm their email and receive a manual account review before accessing team features.</p>
          <Link href="/auth/register">Create an account <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </article>
        <article>
          <span><UsersRound size={25} aria-hidden="true" /></span>
          <p className="about-feature-number">03 · COLLABORATE</p>
          <h3>Build with your people</h3>
          <p>Discover complementary skills, find an event team, apply to join, or create a team of your own.</p>
          <Link href="/teams">Explore teams <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </article>
      </div>
      <div className="about-trust">
        <div className="about-trust-icon"><ShieldCheck size={27} aria-hidden="true" /></div>
        <div>
          <h2>Trust matters.</h2>
          <p>Public event information may be community submitted, organizer verified, or admin verified. Always check an organizer&apos;s own site for current deadlines, eligibility, and registration information. Student profile access is limited to authorized members, and verification evidence is stored privately.</p>
        </div>
      </div>
    </section>
  );
}
