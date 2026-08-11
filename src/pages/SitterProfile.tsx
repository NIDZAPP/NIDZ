import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function SitterProfile() {
  const { id } = useParams();
  return (
    <div className="container py-10">
      <Helmet>
        <title>Nidz — Sitter Profile</title>
        <meta name="description" content="Sitter profile page" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Sitter #{id}</h1>
      <p className="text-muted-foreground">Services, pricing, reviews and calendar (coming soon).</p>
    </div>
  );
}
