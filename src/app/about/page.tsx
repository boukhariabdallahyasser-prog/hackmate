import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, CheckCircle2,
  ChevronDown, Compass, Fingerprint, LockKeyhole, MailCheck,
  MousePointer2, ShieldCheck, Sparkles, Trophy, UsersRound,
} from "lucide-react";

export const metadata: Metadata = { title: "How HackMate works" };

const capabilities = [
  { index: "01", icon: Compass, name: "Discover the right event", description: "Browse student hackathons, coding challenges, workshops and competitions. Filter by skill, date, city or university.", className: "v3-about-purple" },
  { index: "02", icon: UsersRound, name: "Meet your future teammates", description: "Connect with verified students, find an open team and compare the skills you can bring to the same challenge.", className: "v3-about-peach" },
  { index: "03", icon: CalendarDays, name: "Keep your plans together", description: "Bookmark upcoming opportunities, write private notes, track your application plans and download calendar reminders.", className: "v3-about-mint" },
] as const;

export default function About() {
  return (
    <>
      <section className="v3-about-hero">
        <div className="shell v3-about-hero-inner" data-reveal>
          <span className="v3-about-label"><span className="v3-live-pip" /> A PLACE TO BEGIN</span>
          <h1>Ideas are better<br />when they <em>get built.</em></h1>
          <p>HackMate brings the next generation of Algerian student builders closer to exciting opportunities and to each other.</p>
          <div className="v3-about-hero-actions">
            <Link href="/events" className="v3-about-primary">Find an event <ArrowUpRight size={20} aria-hidden="true" /></Link>
            <Link href="/auth/register" className="v3-about-secondary">Join HackMate <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="v3-about-art" aria-hidden="true"><span className="v3-about-art-orbit" /><span className="v3-about-art-orbit two" /><span className="v3-about-art-symbol"><Sparkles size={65} /></span><span className="v3-about-art-tag one">CREATE / SHIP</span><span className="v3-about-art-tag two">01 / DISCOVER</span></div>
        </div>
      </section>

      <section className="shell v3-about-capabilities">
        <div className="v3-section-header" data-reveal>
          <div><span className="v3-section-kicker">WHAT YOU CAN DO HERE</span><h2>Not just another<br /><em>events list.</em></h2></div>
          <div className="v3-section-intro"><p>Discovering a challenge is just the start. HackMate helps you get organized and find the people to take it on with.</p></div>
        </div>
        <div className="v3-about-feature-grid">
          {capabilities.map(({ index, icon: Icon, name, description, className }) => (
            <article className={`v3-about-feature ${className}`} key={index} data-reveal>
              <div className="v3-about-feature-top"><span>{index} / 03</span><ArrowUpRight size={21} aria-hidden="true" /></div>
              <span className="v3-about-feature-icon"><Icon size={38} strokeWidth={1.7} aria-hidden="true" /></span>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="v3-about-access">
        <div className="shell v3-about-access-layout">
          <div className="v3-about-access-left" data-reveal>
            <span className="v3-section-kicker">SAFE BY DESIGN</span>
            <h2>A community of<br /><em>real students.</em></h2>
            <p>Public event listings are open to everyone. To access teams and private collaboration features, students verify their university address and complete approval.</p>
            <div className="v3-about-access-principles">
              <span><ShieldCheck size={20} /> University-focused membership</span>
              <span><LockKeyhole size={20} /> Private planning and account information</span>
              <span><MousePointer2 size={20} /> Clear sources and independent registration</span>
            </div>
          </div>
          <div className="v3-about-access-steps" data-reveal>
            {[
              { number: "01", icon: MailCheck, title: "Use your university email", detail: "Create an account using an approved institutional email address." },
              { number: "02", icon: CheckCircle2, title: "Confirm your address", detail: "Follow the verification email to prove that you control it." },
              { number: "03", icon: Fingerprint, title: "Get student approval", detail: "A HackMate administrator reviews your account before private features open." },
              { number: "04", icon: BookOpenCheck, title: "Create your profile", detail: "Choose your skills, interests and availability to find compatible builders." },
            ].map(({ number, icon: Icon, title, detail }) => (
              <div className="v3-about-access-step" key={number}>
                <span className="v3-about-access-step-number">{number}</span>
                <span className="v3-about-access-step-icon"><Icon size={22} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{detail}</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell v3-about-faq">
        <div className="v3-section-header" data-reveal><div><span className="v3-section-kicker">GOOD QUESTIONS</span><h2>The important<br /><em>stuff, explained.</em></h2></div></div>
        <div className="v3-about-faq-grid">
          {[
            { title: "Can I discover events without an account?", answer: "Yes. Public event discovery and individual event details are available to everyone. Student verification is required for private team and account features." },
            { title: "Can I join a hackathon directly on HackMate?", answer: "HackMate helps you discover opportunities and prepare. Registration itself takes place through the organizer's official link when one is available. Always verify the latest rules with the organizer." },
            { title: "Why do students need approval?", answer: "HackMate is designed around university communities. Approved institutional email addresses and staff review protect collaboration features from unverified accounts." },
            { title: "Can I recommend a hackathon?", answer: "Yes. Verified students can suggest an event, including a source URL and event poster. Moderators review submissions before they appear publicly." },
          ].map(({ title, answer }) => (
            <details className="v3-about-question" key={title}>
              <summary>{title}<ChevronDown size={19} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <div className="v3-about-final">
          <span><Trophy size={22} aria-hidden="true" /> READY TO MAKE SOMETHING HAPPEN?</span>
          <div><h2>Your next opportunity<br />is waiting to be found.</h2><Link href="/events" className="v3-pill-primary">Explore opportunities <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        </div>
      </section>
    </>
  );
}
