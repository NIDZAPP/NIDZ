import { Helmet } from "react-helmet-async";

export default function OwnerBookings() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>PetLink DZ — My bookings</title>
        <meta name="description" content="Owner bookings" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">My bookings</h1>
      <p className="text-muted-foreground">Upcoming and past bookings (coming soon).</p>
    </div>
  );
}
