import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/search");
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container py-12 md:py-20 grid gap-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-4 animate-fade-in">
            {t("home.title")}
          </h1>
          <p className="text-lg text-muted-foreground mb-6 animate-fade-in">
            {t("home.subtitle")}
          </p>
        </div>

        <form onSubmit={onSearch} className="bg-card border rounded-xl p-4 md:p-6 shadow-sm grid gap-3 md:grid-cols-3">
          <Select defaultValue="walk30">
            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk30">Walk 30 min</SelectItem>
              <SelectItem value="walk60">Walk 60 min</SelectItem>
              <SelectItem value="dropin">Drop-in</SelectItem>
              <SelectItem value="daycare">Daycare</SelectItem>
              <SelectItem value="boarding">Boarding</SelectItem>
              <SelectItem value="taxi">Pet Taxi</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Hydra, Algiers" />
          <Button type="submit" className="w-full">
            {t("home.searchCta")}
          </Button>
        </form>
      </div>
    </section>
  );
}
