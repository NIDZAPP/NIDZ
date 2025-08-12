import { Helmet } from "react-helmet-async";

export default function SitterDashboard() {
  return (
    <div className="container py-10">
      <Helmet>
        <title>PetLink DZ — Sitter Dashboard</title>
        <meta name="description" content="Manage your sitter profile and jobs" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Sitter Dashboard</h1>
      <p className="text-muted-foreground">Today, Calendar, Inbox, Wallet, Listing editor (coming soon).</p>
    </div>
  );
}
