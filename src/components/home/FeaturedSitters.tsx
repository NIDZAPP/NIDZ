import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { formatDZD } from "@/utils/format";

/* NOTE: this component is currently rendered by nothing — `src/pages/Index.tsx`
   mounts only `RoleSelection`. It is kept because a home-page sitter preview is
   likely to return, but the invented ratings it used to carry (4.9, 4.8, …) had
   to go: there is no review mechanism, so a rating here is forbidden (§6 C,
   §6.1, §7). Whoever wires this up owes it the same treatment `/search` now
   has — demo-marked, provenance-labelled, one action per card. */

const DEMO_SITTERS = [
  { id: 1, name: "Sara", area: "Hydra", pricePerNight: 1200 },
  { id: 2, name: "Yacine", area: "Cheraga", pricePerNight: 900 },
  { id: 3, name: "Nadia", area: "Dely Ibrahim", pricePerNight: 1000 },
];

export default function FeaturedSitters() {
  const { t, i18n } = useTranslation();
  const base = i18n.language?.split("-")[0];
  const lng = base === "fr" || base === "ar" ? base : "en";

  return (
    <section className="container pb-12 md:pb-20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("search.results.titleAll")}</h2>
        <Button asChild variant="ghost">
          <Link to="/search">{t("home.searchCta")}</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {DEMO_SITTERS.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">
                <bdi>{s.name}</bdi> · <bdi>{s.area}</bdi>
              </CardTitle>
              <p className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <User className="size-3.5 shrink-0" aria-hidden="true" />
                {t("search.card.demoTag")} · {t("trust.declared")}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {formatDZD(s.pricePerNight, lng)} {t("search.card.unit.night")}
              </p>
              <Button asChild>
                <Link to={`/sitter/${s.id}`}>
                  {t("search.card.viewProfile")}
                  <span className="sr-only"> — {s.name}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
