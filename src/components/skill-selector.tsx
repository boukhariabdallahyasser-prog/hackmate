export function SkillSelector({
  skills,
  selected = [],
}: {
  skills: { id: string; name: string }[];
  selected?: string[];
}) {
  if (skills.length === 0) return null;
  return (
    <fieldset className="checkbox-group">
      <legend>Required skills</legend>
      {skills.map((skill) => (
        <label className="checkbox" key={skill.id}>
          <input
            type="checkbox"
            name="skills"
            value={skill.id}
            defaultChecked={selected.includes(skill.id)}
          />
          {skill.name}
        </label>
      ))}
    </fieldset>
  );
}
