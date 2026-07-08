import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "./lib/session";
import { sessionOptions } from "./lib/session";

const PUBLIC_PATHS = ["/login", "/api/logout", "/_next", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // NextRequest extends the Web API Request and NextResponse extends Response,
  // so both are valid for iron-session's (Request, Response, options) overload.
  const session = await getIronSession<SessionData>(
    request as unknown as Request,
    response as unknown as Response,
    sessionOptions,
  );

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Sliding renewal
  await session.save();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
