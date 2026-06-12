// RBAC ported from PollenAtlas/Models/Roles.cs.
// Roles, highest privilege first. Policies mirror the original authorization policies.
export const ROLES = ["Administrator", "Expert", "Researcher", "Partner"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  Administrator: "Administrator",
  Expert: "Expert — validator",
  Researcher: "Researcher — contributor",
  Partner: "Partner — read-only",
};

/** CanValidate = Administrator, Expert. */
export const canValidate = (role?: string | null) => role === "Administrator" || role === "Expert";
/** CanContribute = Administrator, Expert, Researcher. */
export const canContribute = (role?: string | null) =>
  role === "Administrator" || role === "Expert" || role === "Researcher";
/** CanManage = Administrator. */
export const canManage = (role?: string | null) => role === "Administrator";
