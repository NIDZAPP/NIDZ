import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const { t } = useTranslation();
  return (
    <div className="container py-10">
      <Helmet>
        <title>PetLink DZ — Auth</title>
        <meta name="description" content="Sign in or sign up to PetLink DZ" />
        <link rel="canonical" href="/auth" />
      </Helmet>
      <h1 className="text-3xl font-semibold mb-2">Sign in / Sign up</h1>
      <p className="text-muted-foreground">Email/password and phone OTP coming soon.</p>
    </div>
  );
}
