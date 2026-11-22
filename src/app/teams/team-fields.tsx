import { SkillSelector } from "@/components/skill-selector";
import type { Tables } from "@/types/database";

export function TeamFields({
  skills,
  team,
  selected = [],
}: {
  skills: Pick<Tables<"skills">, "id" | "name">[];
  team?: Tables<"teams">;
  selected?: string[];
}) {
  return (
    <>
      <label>
        Team name
        <input
          name="name"
          minLength={2}
          maxLength={100}
          defaultValue={team?.name}
          required
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          minLength={5}
          maxLength={4000}
          defaultValue={team?.description}
          required
        />
      </label>
      <label>
        Open positions
        <textarea
          name="positions"
          maxLength={1500}
          defaultValue={team?.open_positions}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="recruiting"
          defaultChecked={team?.recruitment_open ?? true}
        />
        Accept join requests
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="private_team"
          defaultChecked={team?.visibility === "private"}
        />
        Private team (invitation only)
      </label>
      <SkillSelector skills={skills} selected={selected} />
    </>
  );
}
