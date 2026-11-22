import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import BackButton from "@/components/shared/BackButton";
import { REGISTER_ROW } from "@/components/shared/register";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import {
  FROM_DASHBOARD,
  canPublish,
  enrichSections,
  missingRequired,
  publishSections,
  sectionCounts,
  type SitterSection,
} from "@/data/sitter-sections";
import type { SitterProfile } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/**
 * "Mon profil" — the sitter's sections dashboard (§51), in two groups.
 *
 * AUDIT 1.3 LOT 05. The 1.2 dashboard counted "3 sections sur 9" while
 * publication needed exactly three, so the nine read as an obligation. The
 * screen now has two groups, each counted on its own:
 *
 *   POUR PUBLIER — the facts an owner needs to judge the offer, and the only
 *   thing publication checks (`publishSections`). The home is in this group
 *   only for a sitter who offers boarding.
 *
 *   ENRICHIR MON PROFIL — optional, and said to be optional. Never a
 *   condition of publication, never a score, and a fuller profile is not a
 *   verified one.
 *
 * THE COUNTS ARE ADMINISTRATIVE (§118): how many sections are answered, never
 * quality, trust or safety, and nothing ranks on them (§43, §120). No progress
 * bar, no badge, no congratulation.
 *
 * A browsable screen since Audit 1.3 LOT 04: the sitter space's "Mon profil"
 * tab. Before the profile is published there is no sitter bar yet, so it
 * carries a Back control to the owner home.
 */
export default function SitterProfileHome() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const heading = useRef<HTMLHeadingElement>(null);

  /* What FlowScreen did when this was one: arriving back from a section
     editor, focus lands on the heading rather than on <body>. No visible ring
     on programmatic focus. */
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const workspace = state.sitter;
  /* Arriving with no sitter workspace — a deep link, a stale tab, a reset —
     means there is nothing to show. The introduction is where this starts. */
  if (!workspace) return <Navigate to="/sitter/start" replace />;

  const profile = workspace.profile;
  const counts = sectionCounts(profile);
  const missing = missingRequired(profile);
  const ready = canPublish(profile) && Boolean(state.account?.accountComplete);
  const published = workspace.published;

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterSections.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        {!published && <BackButton variant="labelled" fallback="/" className="mb-6" />}
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-h1 font-semibold text-foreground focus:outline-none md:text-h1-lg"
        >
          {t("sitterSections.title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("sitterSections.intro")}</p>

        {/* ------------------------------------------------- pour publier */}
        <section aria-labelledby="sections-publish" className="mt-10">
          <h2 id="sections-publish" className="text-name font-semibold text-foreground">
            {t("sitterSections.publish.title")}
          </h2>
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
            {t("sitterSections.publish.body")}{" "}
            <span className="font-medium text-foreground">
              {t("sitterSections.publish.count", { count: counts.publish.answered, total: counts.publish.total })}
            </span>
          </p>
          <SectionRows sections={publishSections(profile)} profile={profile} showServiceNote />

          {/* The one action of the screen, once it is possible. Not a
              disabled button before then: the missing sections are named and
              each one is a link. */}
          <div className="mt-6">
            {ready ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/sitter/preview">
                  {published ? t("sitterSections.viewPublished") : t("sitterSections.preview")}
                </Link>
              </Button>
            ) : (
              <div>
                <p className="text-base text-foreground">
                  {published ? t("sitterSections.missingPublished") : t("sitterSections.missingTitle")}
                </p>
                <ul role="list" className="mt-2 space-y-1">
                  {missing.map((section) => (
                    <li key={section.id} className="text-base">
                      <Link
                        to={section.path}
                        state={FROM_DASHBOARD}
                        className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {t(section.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------- enrichir mon profil */}
        <section aria-labelledby="sections-enrich" className="mt-14">
          <h2 id="sections-enrich" className="text-name font-semibold text-foreground">
            {t("sitterSections.enrich.title")}
          </h2>
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
            {t("sitterSections.enrich.body")}{" "}
            <span className="font-medium text-foreground">
              {t("sitterSections.enrich.count", { count: counts.enrich.answered, total: counts.enrich.total })}
            </span>
          </p>
          <SectionRows sections={enrichSections(profile)} profile={profile} />
        </section>

        <DemoNotice
          className="mt-10"
          title={t("sitterSections.demoTitle")}
          body={t("sitterSections.demoBody")}
        />
      </div>
    </div>
  );
}

function SectionRows({
  sections,
  profile,
  showServiceNote = false,
}: {
  sections: SitterSection[];
  profile: SitterProfile;
  /** In the publish group, say WHY the home is there for a boarding sitter. */
  showServiceNote?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-4">
      {sections.map((section) => {
        const done = section.isAnswered(profile);
        return (
          <Link key={section.id} to={section.path} state={FROM_DASHBOARD} className={REGISTER_ROW}>
            <span className="flex min-w-0 items-start gap-3">
              {/* Slot always reserved, so answering a section never shifts the
                  list under the pointer. A check, never a colour alone; and an
                  sr-only word, because a glyph is not announced. */}
              <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                {done && <Check className="size-5 text-primary" />}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-foreground">
                  {t(section.labelKey)}
                  {done && <span className="sr-only"> — {t("sitterSections.answeredState")}</span>}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {showServiceNote && section.id === "housing"
                    ? t("sitterSections.housing.requiredWhy")
                    : t(section.hintKey)}
                </span>
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
