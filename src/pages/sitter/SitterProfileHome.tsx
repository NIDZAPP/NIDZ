import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import BackButton from "@/components/shared/BackButton";
import { REGISTER_ROW } from "@/components/shared/register";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { SITTER_SECTIONS, answeredSections, canPublish, missingRequired } from "@/data/sitter-sections";
import { useDemo } from "@/state/demo/context";

/**
 * The sitter profile dashboard (§51).
 *
 * Replaces Audit 1.1's eleven-step wizard. §50 asks for modular sections with
 * save and resume, and the reason is practical rather than stylistic: this is
 * the longest surface in the product, and in a linear flow a sitter who cannot
 * answer question four tonight cannot answer question nine either. Every
 * section here is reachable in any order and keeps what was already typed.
 *
 * THE COUNT IS ADMINISTRATIVE. §118 draws the line and it applies to sitters
 * as hard as to animals: this is how many sections have been ANSWERED. It is
 * never quality, never trust, never safety, and nothing ranks on it (§43,
 * §120). The copy says so rather than leaving a percentage to imply otherwise,
 * and there is deliberately no progress bar on this screen, no badge and no
 * congratulation — §51 asks for meaningful completion without gamifying it.
 * (`FlowScreen`'s own `progress` prop is not passed for the same reason.)
 *
 * Required sections are marked as required; everything else is genuinely
 * optional, and an unanswered optional section is not shown as a failure.
 *
 * A BROWSABLE screen since Audit 1.3 LOT 04: it is the sitter space's
 * "Mon profil" tab, so it sits in the layout with the bar rather than owning
 * the viewport. Before the profile is published there is no sitter bar yet,
 * so it carries a Back control to the owner home; once published it is a tab
 * root and carries none.
 */
export default function SitterProfileHome() {
  const { t } = useTranslation();
  const { state } = useDemo();

  const workspace = state.sitter;
  /* Arriving with no sitter workspace — a deep link, a stale tab, a reset —
     means there is nothing to show. The introduction is where this starts. */
  if (!workspace) return <Navigate to="/sitter/start" replace />;

  const profile = workspace.profile;
  const { answered, total } = answeredSections(profile);
  const missing = missingRequired(profile);
  const ready = canPublish(profile);

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterSections.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        {!workspace.published && <BackButton variant="labelled" fallback="/" className="mb-6" />}
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("sitterSections.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("sitterSections.intro")}</p>
        {/* A count, and what it is not. Deliberately a sentence rather than a
            bar: a bar invites a number to be read as a score. */}
        <p className="mt-4 text-sm text-muted-foreground">
          {t("sitterSections.answered", { count: answered, total })} {t("sitterSections.answeredNote")}
        </p>

        {ready && (
          <div className="mt-6">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/sitter/preview">{t("sitterSections.preview")}</Link>
            </Button>
          </div>
        )}

        <div className="mt-8">
          {SITTER_SECTIONS.map((section) => {
            const done = section.isAnswered(profile);
            return (
              <Link key={section.id} to={section.path} className={REGISTER_ROW}>
                <span className="flex min-w-0 items-start gap-3">
                  {/* Slot always reserved, so answering a section never shifts
                      the list under the pointer. A check, never a colour alone
                      (§12.2). */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center"
                  >
                    {done && <Check className="size-5 text-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">
                      {t(section.labelKey)}
                      {section.required && (
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          {t("sitterSections.required")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {t(section.hintKey)}
                    </span>
                  </span>
                </span>
                <ArrowRight
                  className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        {/* Not a disabled button. The sitter is told which sections are
            outstanding and each one is a link — a greyed-out control that will
            not say why is the dead affordance §71-83 names. */}
        {!ready && (
          <div className="mt-8">
            <p className="text-base text-foreground">{t("sitterSections.missingTitle")}</p>
            <ul role="list" className="mt-2 space-y-1">
              {missing.map((section) => (
                <li key={section.id} className="text-base">
                  <Link
                    to={section.path}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t(section.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DemoNotice
          className="mt-10"
          title={t("sitterSections.demoTitle")}
          body={t("sitterSections.demoBody")}
        />
      </div>
    </div>
  );
}
