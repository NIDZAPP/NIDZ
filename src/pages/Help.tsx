import { Helmet } from "react-helmet-async";

export default function Help() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>Nidz — Help</title>
        <meta name="description" content="FAQ and contact" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Help</h1>
      <p className="text-muted-foreground">FAQ and contact (coming soon).</p>
    </div>
  );
}
