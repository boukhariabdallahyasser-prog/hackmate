"use client";

import { useEffect } from "react";

/** Progressive enhancement: hidden/reveal states never apply without JS. */
export function MotionLayer() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reveal = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!reveal.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -34px 0px" });
    reveal.forEach((element) => observer.observe(element));
    document.documentElement.classList.add("enhanced-motion");
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("enhanced-motion");
    };
  }, []);

  return null;
}
