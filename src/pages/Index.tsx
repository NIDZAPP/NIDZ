import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import RoleSelection from "@/components/home/RoleSelection";

export default function Index() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t("common.appName")} — {t("home.title")}</title>
        <meta name="description" content={t("home.subtitle")} />
      </Helmet>
      <RoleSelection />
    </>
  );
}
