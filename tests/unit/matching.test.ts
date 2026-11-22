import { expect, test } from "vitest";
import { matchTeammate, type MatchProfile } from "@/lib/matching";

const learner: MatchProfile = {
  id: "viewer",
  university: "campus",
  availability: "Available",
  roles: ["Designer"],
  skills: new Map([["TypeScript", 2]]),
  interests: new Set(["Open source"]),
};

test("explains event skills, proficiency, roles, availability and shared interests", () => {
  const candidate: MatchProfile = {
    ...learner,
    id: "candidate",
    roles: ["Frontend"],
    skills: new Map([["TypeScript", 5]]),
  };
  const result = matchTeammate(learner, candidate, new Set(["TypeScript"]));
  expect(result).toEqual({
    score: 17,
    reasons: [
      "TypeScript proficiency 5/5 (event skill)",
      "Shared interests: Open source",
      "Same university",
      "Available to join a team",
      "Complementary roles: Frontend",
    ],
  });
});
