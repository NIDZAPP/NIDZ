import { Helmet } from "react-helmet-async";

export default function Policies() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>Nidz — Policies</title>
        <meta name="description" content="Terms, privacy and safety policies" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Policies</h1>
      <p className="text-muted-foreground">Terms, Privacy, Safety, Cancellation (coming soon).</p>
    </div>
  );
}
