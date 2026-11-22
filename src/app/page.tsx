import Link from "next/link";
import { ArrowRight, CalendarDays, Code2, Globe, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const formats = [
  { category: "hackathon", label: "Hackathons", icon: Trophy },
  { category: "coding", label: "Coding competitions", icon: Code2 },
  { category: "workshop", label: "Workshops", icon: CalendarDays },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-content">
            <p className="eyebrow">
              <Globe size={15} aria-hidden="true" /> Algeria’s student tech
              community
            </p>
            <h1>
              Find your next
              <br className="hero-break" /> <em>hackathon.</em>
            </h1>
            <p className="hero-copy">
              Explore student tech events across Algeria, from campus workshops
              to national coding competitions.
            </p>
            <Button asChild>
              <Link href="/events">
                Explore events <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span>{"{ }"}</span>
            <span className="art-cursor" />
          </div>
        </div>
      </section>
      <section className="shell section">
        <div className="section-heading">
          <h2>Explore by category</h2>
          <Link href="/events">
            All events <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {formats.map(({ category, label, icon: Icon }) => (
            <Link
              className="category"
              key={category}
              href={`/events?category=${category}`}
            >
              <Icon aria-hidden="true" size={25} />
              <span>{label}</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
