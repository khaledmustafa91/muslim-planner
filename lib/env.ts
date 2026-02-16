export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is missing. Configure it in Vercel env vars.");
  }
  return secret;
}
