import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatDZD } from "@/utils/format";
import i18n from "@/i18n";

const sitters = [
  { id: 1, name: "Sara", area: "Hydra", rating: 4.9, price: 1200 },
  { id: 2, name: "Yacine", area: "Cheraga", rating: 4.8, price: 900 },
  { id: 3, name: "Nadia", area: "Dely Ibrahim", rating: 4.7, price: 1000 },
  { id: 4, name: "Omar", area: "El Biar", rating: 4.6, price: 800 },
  { id: 5, name: "Karim", area: "Kouba", rating: 4.8, price: 1500 },
  { id: 6, name: "Lina", area: "Ben Aknoun", rating: 4.9, price: 1300 },
];

export default function FeaturedSitters() {
  const { t } = useTranslation();
  const lng = (i18n.language as 'en' | 'fr' | 'ar') || 'en';

  return (
    <section className="container pb-12 md:pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Featured sitters</h2>
        <Button asChild variant="ghost" className="hover-scale">
          <Link to="/search">See all</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sitters.map((s) => (
          <Card key={s.id} className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{s.name} · {s.area}</span>
                <span className="text-sm text-muted-foreground">★ {s.rating.toFixed(1)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">Walk 30 · {formatDZD(s.price, lng)}</div>
              <Button asChild size="sm">
                <Link to={`/sitter/${s.id}`}>{t('listing.services')}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
