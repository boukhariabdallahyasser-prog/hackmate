import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { review } from "../../actions";
import { httpsUrl, uuid } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffEventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { client } = await requireMember("moderator");
  const { event } = await params;
  if (!uuid.safeParse(event).success) notFound();
  const { data } = await client
    .from("events")
    .select("title,organizer,description,source_url,moderation_status")
    .eq("id", event)
    .maybeSingle();
  if (!data) notFound();
  const source = httpsUrl(data.source_url);
  return (
    <article className="shell section prose">
      <Link href="/staff">Moderation dashboard</Link>
      <h1>{data.title}</h1>
      <p>
        {data.organizer} · {data.moderation_status}
      </p>
      <p>{data.description}</p>
      {source && (
        <a href={source} rel="noreferrer">
          Review source
        </a>
      )}
      {data.moderation_status === "approved" && (
        <ActionForm
          action={review.bind(null, "unpublish", event)}
          submit="Unpublish event"
        >
          <label>
            Reason
            <textarea name="reason" minLength={3} maxLength={1000} required />
          </label>
        </ActionForm>
      )}
    </article>
  );
}
