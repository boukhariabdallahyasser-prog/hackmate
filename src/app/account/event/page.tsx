import { ActionForm } from "@/components/action-form";
import { SkillSelector } from "@/components/skill-selector";
import { categories, formats } from "@/lib/events";
import { requireMember } from "@/lib/supabase/server";
import { submitEvent } from "./actions";

export default async function SubmitEventPage() {
  const { client } = await requireMember("verified");
  const { data: skills } = await client
    .from("skills")
    .select("id,name")
    .order("name");
  return (
    <section className="form-page">
      <h1>Submit an event</h1>
      <p>Approved events appear in the public directory.</p>
      <ActionForm action={submitEvent} submit="Submit for review">
        <label>
          Title
          <input name="title" minLength={3} maxLength={160} required />
        </label>
        <label>
          Organizer
          <input name="organizer" minLength={2} maxLength={120} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            minLength={10}
            maxLength={12000}
            required
          />
        </label>
        <label>
          Category
          <select name="category">
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Format
          <select name="format">
            {Object.entries(formats).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input name="location" maxLength={160} />
        </label>
        <label>
          Starts (Algeria time)
          <input type="datetime-local" name="starts_at" required />
        </label>
        <label>
          Ends (Algeria time)
          <input type="datetime-local" name="ends_at" required />
        </label>
        <label>
          Registration deadline (Algeria time)
          <input type="datetime-local" name="registration_deadline" />
        </label>
        <label>
          Minimum team size
          <input
            type="number"
            name="min_team_size"
            min={1}
            max={100}
            defaultValue={1}
            required
          />
        </label>
        <label>
          Maximum team size
          <input
            type="number"
            name="max_team_size"
            min={1}
            max={100}
            defaultValue={5}
            required
          />
        </label>
        <label>
          Source URL
          <input type="url" name="source_url" maxLength={500} required />
        </label>
        <label>
          Registration URL
          <input type="url" name="registration_url" maxLength={500} />
        </label>
        <label>
          Official website
          <input type="url" name="official_url" maxLength={500} />
        </label>
        <label>
          Cover image URL
          <input type="url" name="cover_path" maxLength={500} />
        </label>
        <label>
          Eligibility
          <textarea name="eligibility" maxLength={2000} />
        </label>
        <label>
          Prizes
          <textarea name="prizes" maxLength={2000} />
        </label>
        <SkillSelector skills={skills ?? []} />
      </ActionForm>
    </section>
  );
}
