import { describe, expect, test } from "vitest";
import { posterSvg, xmlText } from "@/lib/event-poster";

describe("hackathon poster generation", () => {
  test("produces a distinct safe SVG for published event metadata", () => {
    const a = posterSvg({ slug: "hackathon-one", title: 'Build <AI> & "Secure" apps', category: "hackathon", organizer: "ENSIA" });
    const b = posterSvg({ slug: "hackathon-two", title: "Build something new", category: "hackathon", organizer: "ENSIA" });
    expect(a).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(a).toContain("&lt;AI&gt;");
    expect(a).toContain("&amp;");
    expect(a).not.toContain("<AI>");
    expect(a).not.toContain("<script>");
    expect(b).not.toEqual(a);
  });

  test("escapes unsafe markup and limits very long titles", () => {
    expect(xmlText('<script>alert("x")</script>')).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    const long = posterSvg({ slug: "long-test", title: "Hackathon ".repeat(60), category: "workshop", organizer: "Organizer" });
    expect(long.length).toBeLessThan(6000);
    expect(long).toContain("WORKSHOP");
  });
});
