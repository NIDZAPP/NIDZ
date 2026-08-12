import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";

export default function RoleSelection() {
  const { t } = useTranslation();

  return (
    <section className="container py-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6 text-foreground">
            {t("common.appName")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* The action is the button, not the card: a div with onClick is
              unreachable by keyboard, and the button already covers the same
              destination, so the outer handler was pure redundancy. */}
          <Card className="p-8 transition-colors">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">{t("roles.sitter")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("roles.sitterDescription")}
                </p>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link to="/sitter/register">{t("roles.becomeSitter")}</Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 transition-colors">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">{t("roles.owner")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("roles.ownerDescription")}
                </p>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link to="/search">{t("roles.findSitter")}</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}