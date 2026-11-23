"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Command, Compass, Search, Sparkles, Trophy, UsersRound, X } from "lucide-react";

const shortcuts = [
  { href: "/events?upcoming=1", label: "Upcoming events", detail: "See what's next", icon: Compass },
  { href: "/events?category=hackathon", label: "Hackathons", detail: "Build, compete, collaborate", icon: Trophy },
  { href: "/events?category=ai", label: "AI challenges", detail: "Machine learning and more", icon: Sparkles },
  { href: "/community", label: "Find your people", detail: "Connect with fellow builders", icon: UsersRound },
];

export function CommandSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing = target instanceof HTMLElement &&
        (target.matches("input,textarea,select") || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, [open]);

  return (
    <>
      <button type="button" className={compact ? "command-trigger command-trigger-icon" : "command-trigger"}
        onClick={() => setOpen(true)} aria-label="Search events and pages" aria-haspopup="dialog">
        <Search size={18} aria-hidden="true" />
        {!compact && <><span>Search everything</span><kbd><Command size={11} aria-hidden="true" /> K</kbd></>}
      </button>
      {open && (
        <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-heading">
            <div className="command-dialog-top">
              <Search size={22} aria-hidden="true" />
              <h2 id="command-heading" className="sr-only">Search HackMate</h2>
              <form className="command-form" action="/events" method="get" onSubmit={() => setOpen(false)}>
                <input ref={inputRef} type="search" name="q" placeholder="Search events, hackathons, keywords..." aria-label="Search events"
                  maxLength={100} autoComplete="off" />
              </form>
              <button className="command-close" type="button" onClick={() => setOpen(false)} aria-label="Close search"><X size={19} /></button>
            </div>
            <div className="command-content">
              <div className="command-list-heading">JUMP RIGHT IN <span>QUICK LINKS</span></div>
              <div className="command-shortcuts">
                {shortcuts.map(({ href, label, detail, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)} className="command-result">
                    <span className="command-result-icon"><Icon size={20} aria-hidden="true" /></span>
                    <span><strong>{label}</strong><small>{detail}</small></span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="command-footer">
              <span><kbd>Enter</kbd> to search</span>
              <span><kbd>Esc</kbd> to close</span>
              <span className="command-footer-brand">HACKMATE / FIND YOUR NEXT THING</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
