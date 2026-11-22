import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <section className="shell section prose">
      <h1>About HackMate</h1>
      <p>
        HackMate helps university students in Algeria discover technology events
        and meet people to build with.
      </p>
      <p>
        Public event listings identify the source of the information. Check the
        organizer’s website for current registration details and eligibility.
      </p>
      <Link href="/events">Browse events</Link>
    </section>
  );
}
