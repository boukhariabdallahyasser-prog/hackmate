"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function MobileMenu({
  links,
}: {
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="hackmate-mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
      </button>
      {open && (
        <nav id="hackmate-mobile-navigation" aria-label="Mobile navigation">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            className="mobile-join"
            href="/auth/register"
            onClick={() => setOpen(false)}
          >
            Join HackMate <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </div>
  );
}
