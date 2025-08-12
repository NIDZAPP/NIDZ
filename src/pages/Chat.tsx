import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function Chat() {
  const { bookingId } = useParams();
  return (
    <div className="container py-10">
      <Helmet>
        <title>PetLink DZ — Chat</title>
        <meta name="description" content="Chat with your sitter" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Chat · Booking #{bookingId}</h1>
      <p className="text-muted-foreground">Realtime messaging coming soon.</p>
    </div>
  );
}
