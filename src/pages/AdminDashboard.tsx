import { Helmet } from "react-helmet-async";

export default function AdminDashboard() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>Nidz — Admin</title>
        <meta name="description" content="Admin dashboard" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground">KYC reviews, disputes, listings moderation, metrics (coming soon).</p>
    </div>
  );
}
