// Typed string-enum unions + human labels, ported from PollenAtlas/Models/Enums.cs.
// SQLite has no native enums, so these are stored as their string name and given
// type-safety + display labels here.

export const ValidationStatus = ["Draft", "Submitted", "UnderReview", "Validated", "Rejected", "Published"] as const;
export type ValidationStatus = (typeof ValidationStatus)[number];

export const NativeStatus = ["Unknown", "Native", "Endemic", "Introduced", "Cultivated", "Invasive"] as const;
export type NativeStatus = (typeof NativeStatus)[number];

export const HabitatType = ["Unspecified", "Desert", "Mountain", "Wadi", "Coastal", "Mangrove", "Urban", "Agricultural", "ProtectedArea", "Other"] as const;
export type HabitatType = (typeof HabitatType)[number];

export const PollenShape = ["Unknown", "Spheroidal", "Prolate", "Oblate", "Subprolate", "Suboblate", "Perprolate", "Peroblate", "Other"] as const;
export type PollenShape = (typeof PollenShape)[number];

export const AperturePattern = ["Unknown", "Inaperturate", "Monosulcate", "Tricolpate", "Tricolporate", "Triporate", "Polycolpate", "Polyporate", "Stephanocolpate", "Other"] as const;
export type AperturePattern = (typeof AperturePattern)[number];

export const SurfaceOrnamentation = ["Unknown", "Psilate", "Scabrate", "Verrucate", "Reticulate", "Echinate", "Striate", "Foveolate", "Rugulate", "Gemmate", "Other"] as const;
export type SurfaceOrnamentation = (typeof SurfaceOrnamentation)[number];

export const FloweringSeason = ["Unknown", "Winter", "Spring", "Summer", "Autumn", "YearRound", "Variable"] as const;
export type FloweringSeason = (typeof FloweringSeason)[number];

export const TrapStatus = ["Planned", "Installed", "Active", "Maintenance", "Faulty", "Decommissioned"] as const;
export type TrapStatus = (typeof TrapStatus)[number];

export const SampleSourceType = ["AirborneTrap", "FieldPlantSample", "EnvironmentalSample", "HoneySample", "ReferenceCollection", "Other"] as const;
export type SampleSourceType = (typeof SampleSourceType)[number];

export const MicroscopeType = ["LightMicroscopy", "SEM", "TEM", "Confocal", "Fluorescence", "Other"] as const;
export type MicroscopeType = (typeof MicroscopeType)[number];

/** Insert spaces before capitals so "UnderReview" → "Under Review", "ProtectedArea" → "Protected Area". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

/** Status → swatch colour for the validation badges (mirrors site.js statusBadge). */
export const statusColor: Record<string, string> = {
  Draft: "#5a6268",
  Submitted: "#1d4a7a",
  UnderReview: "#8a5a06",
  Validated: "#1f5d3a",
  Rejected: "#8c2832",
  Published: "#163f28",
};
