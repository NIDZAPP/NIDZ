import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

import DeclaredField from "@/components/shared/DeclaredField";
import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { FieldShell } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Declared } from "@/data/pets";
import {
  PROFESSION_KINDS,
  asLocalized,
  localized,
  type ProfessionalBackground,
  type SitterExperience,
} from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";

const DASHBOARD = "/sitter/profile";

/**
 * The shell for a profile SECTION.
 *
 * Different from `BuilderStep` in one way that matters: it returns to the
 * dashboard rather than chaining to a next step, and it carries no progress
 * bar. There is no "next" any more — §51 replaced the wizard with sections
 * that can be answered in any order — so a control implying a fixed sequence
 * would be describing a flow that no longer exists.
 */
function Section({
  title,
  intro,
  children,
  onSave,
  footNote,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  onSave: () => void;
  footNote?: ReactNode;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useDemo();
  const formId = "sitter-section";

  if (!state.sitter) return <Navigate to="/sitter/start" replace />;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo={DASHBOARD}
        title={title}
        intro={intro}
        action={
          <Button type="submit" form={formId} size="lg">
            {t("sitterSections.save")}
          </Button>
        }
        footNote={footNote}
      >
        <form
          id={formId}
          noValidate
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
            navigate(DASHBOARD);
          }}
        >
          {children}
        </form>
      </FlowScreen>
    </>
  );
}

/* ------------------------------------------------------------- experience */

const CAPABILITIES = [
  "puppiesKittens",
  "seniors",
  "specialNeeds",
  "oralMedication",
  "multipleAnimals",
  "reactiveAnimals",
  "paidBefore",
  "volunteered",
] as const;

/**
 * What the sitter has actually done (§54).
 *
 * Concrete questions rather than a number. "Six years" says much less about
 * whether someone can give a cat a tablet than "can you give oral medication"
 * does, and §54 is explicit that years alone must never be a proxy for safety.
 *
 * Every answer is optional and every one defaults to unanswered. A sitter who
 * says "I don't know" to reactive dogs has told an owner something true; a
 * sitter forced into "no" would have been filtered out of work they can do.
 */
export function SectionExperience() {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const profile = state.sitter?.profile;

  const [answers, setAnswers] = useState<Record<string, Declared>>(() =>
    Object.fromEntries(CAPABILITIES.map((key) => [key, profile?.experience[key] ?? "unknown"])),
  );

  const save = () => {
    if (!profile) return;
    dispatch({
      type: "patchSitterProfile",
      patch: {
        /* Spread first: this section owns the capability answers and nothing
           else, and rebuilding the record would reset the years and species
           the "about" section collects. */
        experience: { ...profile.experience, ...(answers as Partial<SitterExperience>) },
      },
    });
  };

  return (
    <Section
      title={t("sitterSections.experience.label")}
      intro={t("sitterExperience.intro")}
      onSave={save}
      footNote={<DemoLine>{t("sitterExperience.demoNote")}</DemoLine>}
    >
      {CAPABILITIES.map((key) => (
        <DeclaredField
          key={key}
          label={t(`sitterExperience.${key}.label`)}
          value={answers[key]}
          onChange={(next) => setAnswers((prev) => ({ ...prev, [key]: next }))}
        />
      ))}
    </Section>
  );
}

/* ----------------------------------------------------------- professional */

/**
 * Professional background (§40, §55), declared and nothing more.
 *
 * A closed list rather than a free-text box, so "veterinarian" means the same
 * thing on every profile instead of being one of forty spellings. "No
 * professional background" is one of the options, because it is a real answer
 * and a different fact from having skipped the question.
 *
 * NOTHING HERE VERIFIES ANYTHING, and the screen says so twice — once beside
 * the question about documents, once under the action. §68 requires declared
 * profession, submitted document, pending verification and verified credential
 * to stay four separate states; Nidz has only the first, so choosing
 * "Veterinarian" produces no badge, no ranking change and no mark on the
 * public profile beyond the sentence the sitter typed.
 */
export function SectionProfessional() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state, dispatch } = useDemo();
  const profile = state.sitter?.profile;

  const [kind, setKind] = useState<ProfessionalBackground["kind"]>(profile?.professional.kind ?? null);
  const [detail, setDetail] = useState(
    profile ? localized(profile.professional.detail, lng) : "",
  );
  const [years, setYears] = useState(
    profile?.professional.years === null || profile?.professional.years === undefined
      ? ""
      : String(profile.professional.years),
  );
  const [canEvidence, setCanEvidence] = useState<Declared>(
    profile?.professional.canEvidence ?? "unknown",
  );

  /* The follow-up questions only exist once there is something to follow up.
     Asking a sitter with no animal background how many years they have had it
     is the kind of dead field §50 warns about. */
  const hasBackground = kind !== null && kind !== "none";

  const save = () => {
    const parsed = Number(years);
    dispatch({
      type: "patchSitterProfile",
      patch: {
        professional: {
          kind,
          detail: asLocalized(hasBackground ? detail.trim() : ""),
          years:
            hasBackground && years !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 70
              ? parsed
              : null,
          canEvidence: hasBackground ? canEvidence : "unknown",
        },
      },
    });
  };

  return (
    <Section
      title={t("sitterSections.professional.label")}
      intro={t("sitterProfessional.intro")}
      onSave={save}
      footNote={<DemoLine>{t("sitterProfessional.demoNote")}</DemoLine>}
    >
      <div>
        <p id="prof-kind" className="mb-3 text-sm font-medium text-foreground">
          {t("sitterProfessional.kindLabel")}
        </p>
        <OptionGroup
          labelledBy="prof-kind"
          value={kind}
          onChange={(next) => setKind(next as ProfessionalBackground["kind"])}
          options={[
            ...PROFESSION_KINDS.map((value) => ({
              value: value as string,
              label: t(`profession.${value}`),
            })),
            /* Last, and phrased as an answer rather than an opt-out. */
            { value: "none", label: t("profession.none") },
          ]}
        />
      </div>

      {hasBackground && (
        <>
          <FieldShell label={t("sitterProfessional.detailLabel")} help={t("sitterProfessional.detailHelp")}>
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                rows={4}
                value={detail}
                aria-describedby={describedBy}
                onChange={(e) => setDetail(e.target.value)}
              />
            )}
          </FieldShell>

          <FieldShell label={t("sitterProfessional.yearsLabel")}>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={70}
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            )}
          </FieldShell>

          <DeclaredField
            label={t("sitterProfessional.evidenceLabel")}
            help={t("sitterProfessional.evidenceHelp")}
            value={canEvidence}
            onChange={setCanEvidence}
          />
        </>
      )}
    </Section>
  );
}
