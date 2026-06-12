// The Atlas expert panel shown in the "Meet the experts" section on the home page.
// Edit freely — set `photo` to a URL (e.g. /uploads/...) to show a real portrait;
// otherwise a coloured initials avatar is rendered.
export type Expert = {
  name: string;
  title: string;
  specialty: string;
  bio: string;
  color: string;
  photo?: string;
};

export const experts: Expert[] = [
  {
    name: "Dr. Aisha Al Marri",
    title: "Lead Palynologist",
    specialty: "Pollen morphology",
    color: "#1f5d3a",
    bio: "Builds and curates the reference pollen catalogue — classifying grains by shape, aperture, and surface so field records can be identified with confidence.",
  },
  {
    name: "Dr. Omar Haddad",
    title: "Aerobiology & Air Quality",
    specialty: "Trap networks",
    color: "#2c6e8f",
    bio: "Runs the trap network and the aerobiology pipeline, turning daily grain counts and air-quality feeds into the combined risk index that drives the alerts.",
  },
  {
    name: "Dr. Hessa Al Suwaidi",
    title: "Botany & Phenology",
    specialty: "Flowering calendar",
    color: "#c98a2b",
    bio: "Maintains the flowering calendar for UAE flora, modelling how bloom windows shift with rainfall and season so the forecast can predict pollen before it is sampled.",
  },
  {
    name: "Dr. Khalid Rahman",
    title: "Apiculture & Bee Forage",
    specialty: "Apiary placement",
    color: "#6c4f9c",
    bio: "Advises beekeepers on forage and mobile apiary placement, linking bee-forage plants in bloom to the best locations for honey production across the emirates.",
  },
];
