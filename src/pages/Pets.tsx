import { Helmet } from "react-helmet-async";

export default function Pets() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>Nidz — Pets</title>
        <meta name="description" content="Manage your pets" />
        <link rel="canonical" href="/pets" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">My Pets</h1>
      <p className="text-muted-foreground">Create and manage pet profiles (coming soon).</p>
    </div>
  );
}
