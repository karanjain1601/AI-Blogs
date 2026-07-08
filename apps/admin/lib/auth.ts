import "server-only";
import { verify } from "@node-rs/argon2";
import { TOTP } from "otpauth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRatelimit(): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "admin_login",
  });
}

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (!rl) return { allowed: true, remaining: 99 };
  const { success, remaining } = await rl.limit(ip);
  return { allowed: success, remaining };
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !passwordHash) return false;

  // Always run argon2 to avoid timing-based username enumeration
  const passwordOk = await verify(passwordHash, password).catch(() => false);
  return username === expectedUsername && passwordOk;
}

export function verifyTotp(token: string): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) {
    // If no TOTP secret is configured, skip 2FA (dev mode only)
    return true;
  }
  const totp = new TOTP({ secret, digits: 6, period: 30 });
  return totp.validate({ token, window: 1 }) !== null;
}
