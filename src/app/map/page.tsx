import { PageHead } from "@/components/PageHead";
import MapClient from "./MapClient";

export const metadata = { title: "GIS Map · UAE Pollen Atlas" };

export default function MapPage() {
  return (
    <>
      <PageHead
        eyebrow="Spatial intelligence"
        title="GIS Map"
        subtitle="Pollen records, trap devices, beehives, and the regional pollen + air-quality risk index across the UAE."
      />
      <MapClient />
    </>
  );
}
