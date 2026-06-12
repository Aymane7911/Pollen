// Pure validation-workflow definitions. Kept out of the "use server" action file so it
// can export the sync helper + type (a "use server" module may only export async fns).
export type Transition = { to: string; need: "contribute" | "validate"; label: string; icon: string };

export const TRANSITIONS: Record<string, Transition[]> = {
  Draft: [{ to: "Submitted", need: "contribute", label: "Submit for review", icon: "bi-send" }],
  Submitted: [
    { to: "UnderReview", need: "validate", label: "Begin review", icon: "bi-search" },
    { to: "Draft", need: "validate", label: "Return to draft", icon: "bi-arrow-counterclockwise" },
  ],
  UnderReview: [
    { to: "Validated", need: "validate", label: "Validate", icon: "bi-check2-circle" },
    { to: "Rejected", need: "validate", label: "Reject", icon: "bi-x-octagon" },
  ],
  Validated: [
    { to: "Published", need: "validate", label: "Publish", icon: "bi-globe" },
    { to: "UnderReview", need: "validate", label: "Reopen review", icon: "bi-arrow-counterclockwise" },
  ],
  Rejected: [{ to: "Draft", need: "contribute", label: "Revise (back to draft)", icon: "bi-pencil" }],
  Published: [{ to: "UnderReview", need: "validate", label: "Withdraw to review", icon: "bi-arrow-counterclockwise" }],
};

export function allowedTransitions(status: string): Transition[] {
  return TRANSITIONS[status] ?? [];
}
