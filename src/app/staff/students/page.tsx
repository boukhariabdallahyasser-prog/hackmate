import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { requireMember } from "@/lib/supabase/server";
import { reviewStudent } from "./actions";
import { eventDate } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Student approvals",
  robots: { index: false },
};

export default async function StudentApprovalsPage() {
  const { client } = await requireMember("admin");
  const [queue, universities] = await Promise.all([
    client
      .from("student_approvals")
      .select("user_id,university_id,university_email,requested_at")
      .eq("status", "pending")
      .order("requested_at")
      .limit(50),
    client.from("universities").select("id,name"),
  ]);
  const campuses = new Map(
    universities.data?.map(({ id, name }) => [id, name]),
  );
  return (
    <section className="shell section">
      <Link href="/staff" className="underlined">
        Back to moderation
      </Link>
      <h1>Student approvals</h1>
      <p>Review accounts after the student confirms their university email.</p>
      <div className="card-list">
        {queue.error || universities.error ? (
          <p role="alert">The queue is temporarily unavailable.</p>
        ) : queue.data.length === 0 ? (
          <p className="notice">No students are waiting for approval.</p>
        ) : (
          queue.data.map((student) => (
            <article className="notice form-page" key={student.user_id}>
              <strong>{student.university_email}</strong>
              <p className="meta">
                {campuses.get(student.university_id)} ·{" "}
                {eventDate(student.requested_at)}
              </p>
              <ActionForm
                action={reviewStudent.bind(null, student.user_id)}
                submit="Save decision"
              >
                <label>
                  Decision
                  <select name="decision">
                    <option value="approve">Approve account</option>
                    <option value="reject">Decline account</option>
                  </select>
                </label>
                <label>
                  Reason
                  <textarea
                    name="reason"
                    minLength={3}
                    maxLength={1000}
                    required
                  />
                </label>
              </ActionForm>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
