import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import { REGISTER_ROW } from "@/components/shared/register";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { SITTER_SECTIONS, answeredSections, canPublish, missingRequired } from "@/data/sitter-sections";
import { WORKSPACE_ROOT } from "@/data/workspace";
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
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterSections.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo={WORKSPACE_ROOT.sitter}
        title={t("sitterSections.title")}
        intro={t("sitterSections.intro")}
        wide
        headerExtra={
          /* A count, and what it is not. Deliberately a sentence rather than a
             bar: a bar invites a number to be read as a score. */
          <p className="mt-4 text-sm text-muted-foreground">
            {t("sitterSections.answered", { count: answered, total })}{" "}
            {t("sitterSections.answeredNote")}
          </p>
        }
        action={
          ready ? (
            <Button asChild size="lg">
              <Link to="/sitter/preview">{t("sitterSections.preview")}</Link>
            </Button>
          ) : undefined
        }
      >
        <div>
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
      </FlowScreen>
    </>
  );
}
