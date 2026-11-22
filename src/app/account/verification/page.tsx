import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { requireMember } from "@/lib/supabase/server";
import { requestVerification } from "../actions";

export default async function VerificationPage() {
  const { client, id, access } = await requireMember();
  const [profile, history] = await Promise.all([
    client.from("profiles").select("id").eq("id", id).maybeSingle(),
    client
      .from("verification_requests")
      .select("id,status,review_reason,created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const pending = history.data?.some((request) => request.status === "pending");
  return (
    <section className="form-page">
      <h1>Student verification</h1>
      {profile.error || history.error ? (
        <p role="alert">Verification is temporarily unavailable.</p>
      ) : access?.status === "verified" ? (
        <p>Your student status is verified.</p>
      ) : pending ? (
        <p>Your request is waiting for staff review.</p>
      ) : !profile.data ? (
        <p>
          <Link href="/account/profile">Complete your profile</Link> before
          requesting verification.
        </p>
      ) : (
        <ActionForm action={requestVerification} submit="Request verification">
          <p>
            Staff will review your proof of enrollment. Your university is
            inferred from your confirmed email.
          </p>
          <label>
            Academic year
            <input
              name="academic_year"
              placeholder="Second year"
              maxLength={40}
              required
            />
          </label>
          <label>
            Field of study
            <input name="field_of_study" maxLength={100} required />
          </label>
          <label>
            Proof of enrollment
            <input
              type="file"
              name="evidence"
              accept="application/pdf,image/jpeg,image/png"
              required
            />
          </label>
          <p className="meta">PDF, JPEG, or PNG up to 3 MB.</p>
        </ActionForm>
      )}
      {!!history.data?.length && (
        <div className="card-list">
          <h2>Request history</h2>
          {history.data.map((request) => (
            <article className="notice" key={request.id}>
              <p>{request.status}</p>
              {request.review_reason && <p>{request.review_reason}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
