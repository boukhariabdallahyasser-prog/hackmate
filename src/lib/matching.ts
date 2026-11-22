export type MatchProfile = {
  id: string;
  university: string | null;
  availability: string | null;
  roles: string[];
  skills: Map<string, number>;
  interests: Set<string>;
  interestedInEvent?: boolean;
};

export function matchTeammate(
  viewer: MatchProfile,
  candidate: MatchProfile,
  eventSkills: Set<string>,
) {
  const reasons: string[] = [];
  let score = 0;
  const relevantSkills = [...candidate.skills].filter(
    ([name]) =>
      eventSkills.has(name) ||
      (viewer.skills.has(name) && (viewer.skills.get(name) ?? 0) < 3),
  );
  for (const [name, level] of relevantSkills) {
    score += level + (eventSkills.has(name) ? 4 : 0);
    reasons.push(
      `${name} proficiency ${level}/5${eventSkills.has(name) ? " (event skill)" : ""}`,
    );
  }
  const commonInterests = [...candidate.interests].filter((interest) =>
    viewer.interests.has(interest),
  );
  if (commonInterests.length) {
    score += commonInterests.length * 2;
    reasons.push(`Shared interests: ${commonInterests.join(", ")}`);
  }
  if (viewer.university && viewer.university === candidate.university) {
    score += 2;
    reasons.push("Same university");
  }
  if (candidate.availability === "Available") {
    score += 3;
    reasons.push("Available to join a team");
  }
  if (candidate.interestedInEvent) {
    score += 4;
    reasons.push("Interested in this event");
  }
  const unfamiliarRoles = candidate.roles.filter(
    (role) =>
      !viewer.roles.some((owned) => owned.toLowerCase() === role.toLowerCase()),
  );
  if (viewer.roles.length && unfamiliarRoles.length) {
    score += unfamiliarRoles.length;
    reasons.push(`Complementary roles: ${unfamiliarRoles.join(", ")}`);
  }
  return { score, reasons };
}
