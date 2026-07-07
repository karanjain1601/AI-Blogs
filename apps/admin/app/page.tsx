export default function AdminHome() {
  return (
    <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Notes Admin</h1>
      <p>
        The only writer. Phase 2 adds single-credential auth (argon2id + TOTP),
        note/topic CRUD, media upload, and the BlockNote editor.
      </p>
    </main>
  );
}
