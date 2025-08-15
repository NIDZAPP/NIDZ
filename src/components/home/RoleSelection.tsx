import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Heart, Search } from "lucide-react";

export default function RoleSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="container py-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            {t("common.appName")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card className="p-8 hover-scale cursor-pointer border-2 hover:border-primary transition-all duration-300" 
                onClick={() => navigate("/sitter/register")}>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">{t("roles.sitter")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("roles.sitterDescription")}
                </p>
                <Button size="lg" className="w-full">
                  {t("roles.becomeSitter")}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover-scale cursor-pointer border-2 hover:border-secondary transition-all duration-300"
                onClick={() => navigate("/search")}>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">{t("roles.owner")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("roles.ownerDescription")}
                </p>
                <Button size="lg" variant="secondary" className="w-full">
                  {t("roles.findSitter")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}