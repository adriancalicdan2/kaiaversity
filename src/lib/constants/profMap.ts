/**
 * Maps professor Firebase email addresses to their KAIA member IDs.
 * Single source of truth — imported everywhere instead of duplicated.
 */
export const PROF_MEMBER_MAP: Record<string, string> = {
  "charlottehermoso@kaia.com": "member-angela",
  "charicehermoso@kaia.com": "member-charice",
  "xvndrvgon@kaia.com": "member-alexa",
  "sophiaamercado@kaia.com": "member-sophia",
  "charlottescrtr@kaia.com": "member-charlotte",
};

/** Resolve a professor's email to their KAIA member ID, or null */
export function getProfMemberId(email: string | null | undefined): string | null {
  if (!email) return null;
  return PROF_MEMBER_MAP[email] ?? null;
}
