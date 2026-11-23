"use client";

import { useState } from "react";

type Props = {
  title: string;
  slug: string;
  cover?: string | null;
  className?: string;
  priority?: boolean;
};

function approvedCover(value: string | null | undefined): string | null {
  if (!value || !URL.canParse(value)) return null;
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
}

export function EventArtwork({ title: _title, slug, cover, className = "", priority = false }: Props) {
  void _title;
  const [failed, setFailed] = useState(false);
  const submittedCover = approvedCover(cover);
  const fallback = `/events/${slug}/poster`;
  const src = failed || !submittedCover ? fallback : submittedCover;

  return (
    <div className={`event-artwork ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Approved external cover URLs and generated local SVG posters are intentionally unoptimized. */}
      <img
        src={src}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        referrerPolicy="no-referrer"
        draggable={false}
        onError={() => {
          if (!failed) setFailed(true);
        }}
      />
      <span aria-hidden="true" className="event-artwork-flag">{submittedCover && !failed ? "Event cover" : "HackMate artwork"}</span>
    </div>
  );
}
