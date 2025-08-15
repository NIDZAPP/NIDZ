import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search as SearchIcon, Star, Filter, Clock, Shield } from "lucide-react";
import { useState } from "react";

// Mock data for pet sitters
const featuredSitters = [
  {
    id: 1,
    name: "Amina Benali",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    reviewCount: 127,
    pricePerDay: 1200,
    distance: 0.8,
    verified: true,
    responseTime: "< 1h",
    services: ["Promenade", "Garde à domicile", "Visite"]
  },
  {
    id: 2,
    name: "Karim Benaissa",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    reviewCount: 89,
    pricePerDay: 900,
    distance: 1.2,
    verified: true,
    responseTime: "< 2h",
    services: ["Promenade", "Garde de nuit"]
  },
  {
    id: 3,
    name: "Sarah Meziane",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    reviewCount: 156,
    pricePerDay: 1500,
    distance: 2.1,
    verified: true,
    responseTime: "< 30min",
    services: ["Garde à domicile", "Taxi animalier", "Soins"]
  },
  {
    id: 4,
    name: "Youcef Hamidi",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    reviewCount: 73,
    pricePerDay: 800,
    distance: 1.5,
    verified: false,
    responseTime: "< 3h",
    services: ["Promenade", "Jeux"]
  }
];

export default function Search() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState([5]);
  const [priceRange, setPriceRange] = useState([500, 2000]);

  const handleLocationSearch = () => {
    // Géolocalisation logic would go here
    console.log("Searching for current location...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <Helmet>
        <title>{t("common.appName")} — {t("nav.search")}</title>
        <meta name="description" content="Find trusted pet sitters near you" />
      </Helmet>

      {/* Hero Search Section */}
      <section className="bg-white shadow-sm border-b">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">
              {t("search.title")}
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              {t("search.subtitle")}
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder={t("search.locationPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
              <Button 
                onClick={handleLocationSearch}
                size="lg"
                className="px-8"
              >
                <SearchIcon className="w-5 h-5 mr-2" />
                {t("search.searchButton")}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("search.filters")}:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">{t("search.distance")}:</span>
                <div className="w-24">
                  <Slider
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{maxDistance[0]}km</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">{t("search.price")}:</span>
                <div className="w-32">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={3000}
                    min={300}
                    step={100}
                    className="w-full"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {priceRange[0]}-{priceRange[1]} DZD
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">
              {t("search.topRated")}
            </h2>
            <Badge variant="secondary" className="text-sm">
              {featuredSitters.length} {t("search.sittersFound")}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredSitters.map((sitter) => (
              <Card key={sitter.id} className="hover-scale cursor-pointer border-2 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative">
                      <img
                        src={sitter.photo}
                        alt={sitter.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {sitter.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{sitter.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{sitter.distance}km</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{sitter.rating}</span>
                        <span className="text-muted-foreground">({sitter.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{t("search.responds")} {sitter.responseTime}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {sitter.services.slice(0, 2).map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {sitter.services.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{sitter.services.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-primary">
                      {sitter.pricePerDay} DZD
                      <span className="text-sm font-normal text-muted-foreground">/jour</span>
                    </div>
                    <Button size="sm" variant="outline">
                      {t("search.contact")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              {t("search.loadMore")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}