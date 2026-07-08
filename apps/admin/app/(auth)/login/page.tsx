import { loginAction } from "./actions";

export const metadata = { title: "Sign in — Notes Admin" };

const ERRORS: Record<string, string> = {
  invalid: "Invalid username or password.",
  totp: "Invalid authenticator code.",
  rate_limited: "Too many attempts. Try again in 15 minutes.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMsg = error ? (ERRORS[error] ?? "Authentication failed.") : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0d10]">
      <div className="w-full max-w-sm space-y-6 p-8 bg-[#131619] border border-[#2a2e35] rounded-xl">
        <div>
          <h1 className="text-xl font-semibold text-white">Notes Admin</h1>
          <p className="text-sm text-[#8b919a] mt-1">
            Sign in to manage your knowledge base
          </p>
        </div>

        {errorMsg && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#c9cdd4]"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#c9cdd4]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="totp"
              className="block text-sm font-medium text-[#c9cdd4]"
            >
              Authenticator code{" "}
              <span className="text-[#8b919a] font-normal">(6-digit)</span>
            </label>
            <input
              id="totp"
              name="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              className="w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-sm font-mono tracking-widest"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors text-sm"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
