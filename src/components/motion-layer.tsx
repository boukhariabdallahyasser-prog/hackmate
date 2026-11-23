"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement: content is visible without JavaScript.
 * MutationObserver is necessary because Next.js transitions reuse the layout
 * and insert new route content without remounting this provider.
 */
export function MotionLayer() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: "0px 0px -34px 0px" });

    function registerNewSections() {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.reveal-visible)")
        .forEach((element) => observer.observe(element));
    }

    registerNewSections();
    document.documentElement.classList.add("enhanced-motion");
    const mutation = new MutationObserver(registerNewSections);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutation.disconnect();
      observer.disconnect();
      document.documentElement.classList.remove("enhanced-motion");
    };
  }, []);
  return null;
}
