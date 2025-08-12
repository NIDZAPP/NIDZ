import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function Book() {
  const { listingId } = useParams();
  return (
    <div className="container py-10">
      <Helmet>
        <title>PetLink DZ — Booking</title>
        <meta name="description" content="Create a booking request" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Book listing #{listingId}</h1>
      <p className="text-muted-foreground">Step-by-step booking flow (coming soon).</p>
    </div>
  );
}
