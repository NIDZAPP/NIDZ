import { Helmet } from "react-helmet-async";
import Hero from "@/components/home/Hero";
import FeaturedSitters from "@/components/home/FeaturedSitters";
import MapPreview from "@/components/map/MapPreview";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>PetLink DZ — {t('home.title')}</title>
        <meta name="description" content="Find trusted pet sitters and walkers near you in Algeria." />
        <link rel="canonical" href="/" />
      </Helmet>
      <Hero />
      <div className="container mb-10">
        <MapPreview />
      </div>
      <FeaturedSitters />
    </>
  );
};

export default Index;
