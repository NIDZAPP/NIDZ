import { Helmet } from "react-helmet-async";
import MapPreview from "@/components/map/MapPreview";

export default function Search() {
  return (
    <div className="container py-10 grid gap-6">
      <Helmet>
        <title>PetLink DZ — Search</title>
        <meta name="description" content="Search sitters and walkers near you" />
        <link rel="canonical" href="/search" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Search</h1>
      <MapPreview />
      <p className="text-muted-foreground">Map and filters will appear here. Seeded demo results below.</p>
    </div>
  );
}
