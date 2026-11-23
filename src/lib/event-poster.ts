/** Generate an event-specific editorial cover when no official poster is provided.
 * The design is illustrative. It is never presented as an organizer's actual artwork.
 */
export type PosterInput = {
  slug: string;
  title: string;
  category: string;
  organizer: string;
};

const palettes = [
  ["#17113f", "#6e4dff", "#c4ff7e"],
  ["#062c3f", "#067f9c", "#e4ff8f"],
  ["#301027", "#e24f9f", "#ffe28b"],
  ["#251935", "#7c3aed", "#73f0ff"],
  ["#172b27", "#29ac85", "#ffdd79"],
  ["#202044", "#4783eb", "#ffa8c6"],
] as const;

export function xmlText(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  ).replace(/[\u0000-\u001f\u007f]/g, "");
}

function linesForTitle(title: string): string[] {
  const words = title.trim().split(/\s+/u);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > 20 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
    if (lines.length === 3) break;
  }
  if (line && lines.length < 3) lines.push(line);
  const max = lines.map((part) => part.slice(0, 28));
  if (lines.length === 3 && words.join(" ").length > lines.join(" ").length) {
    max[2] = `${max[2].slice(0, 22).trimEnd()}…`;
  }
  return max.length ? max : ["Tech event"];
}

export function posterSvg({ slug, title, category, organizer }: PosterInput) {
  const hash = Array.from(slug).reduce((sum, char) => ((sum * 33) ^ char.codePointAt(0)!) >>> 0, 5381);
  const [dark, vibrant, accent] = palettes[hash % palettes.length];
  const nameLines = linesForTitle(title);
  const size = nameLines.some((line) => line.length > 17) ? 59 : 73;
  const lines = nameLines.map((line, index) =>
    `<text x="74" y="${279 + index * (size + 15)}" fill="#fff" font-size="${size}" font-weight="800" letter-spacing="-2.4">${xmlText(line)}</text>`,
  ).join("");
  const label = xmlText(category.replaceAll("_", " ").toUpperCase().slice(0, 33));
  const source = xmlText(organizer.slice(0, 55));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img">
  <defs>
    <linearGradient id="bg" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${vibrant}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${accent}" stop-opacity=".78"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#fff" opacity=".14"/></pattern>
  </defs>
  <rect width="960" height="640" fill="url(#bg)"/>
  <rect width="960" height="640" fill="url(#dots)"/>
  <circle cx="810" cy="290" r="310" fill="url(#glow)" opacity=".72"/>
  <circle cx="790" cy="330" r="178" fill="none" stroke="#fff" stroke-opacity=".19" stroke-width="2"/>
  <circle cx="790" cy="330" r="236" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
  <path d="M535 520L840 130M654 548L913 198" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="35" stroke-linecap="round"/>
  <rect x="74" y="65" width="166" height="49" rx="24" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-opacity=".28"/>
  <text x="95" y="96" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="800">HACKMATE</text>
  <rect x="74" y="141" width="${Math.min(400, label.length * 15 + 43)}" height="40" rx="20" fill="${accent}"/>
  <text x="94" y="169" fill="#15142d" font-size="19" font-weight="800" font-family="Arial,Helvetica,sans-serif">${label}</text>
  <g font-family="Arial,Helvetica,sans-serif">${lines}</g>
  <path d="M74 557H883" stroke="#fff" stroke-opacity=".43"/>
  <text x="74" y="595" fill="#fff" opacity=".83" font-size="21" font-weight="500" font-family="Arial,Helvetica,sans-serif">${source}</text>
  <text x="881" y="598" text-anchor="end" fill="${accent}" font-size="22" font-weight="900" font-family="Arial,Helvetica,sans-serif">↗</text>
</svg>`;
}
