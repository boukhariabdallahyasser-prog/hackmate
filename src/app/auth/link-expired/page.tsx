import Link from "next/link";

export default function ExpiredLinkPage() {
  return (
    <section className="shell section form-page">
      <h1>Link unavailable</h1>
      <p>This link is invalid, expired, or already used.</p>
      <div className="text-links">
        <Link href="/auth/sign-in">Sign in</Link>
        <Link href="/auth/recover">Request a reset link</Link>
      </div>
    </section>
  );
}
