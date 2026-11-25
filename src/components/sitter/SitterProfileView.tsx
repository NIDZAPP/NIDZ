import { acceptanceOf } from "@/data/compatibility";
import { getKind } from "@/data/animal-kinds";
import { CalendarOff, Heart, MapPin, PawPrint } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { CARE_ICON, HOUSING_ICON, OUTDOOR_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { careLines } from "@/components/sitter/care-lines";
import { MatchReasonList, MismatchList } from "@/components/sitter/match";
import { ProvenanceLabel } from "@/components/shared/trust";
import PortfolioSection from "@/components/sitter/PortfolioSection";
import { ProfileFold, ProfileFolds } from "@/components/sitter/ProfileFold";
import ReviewSection from "@/components/sitter/ReviewSection";
import { sitterPortfolio, sitterReviews } from "@/data/repository";
import { isAbsenceReason, type MatchReason } from "@/data/criteria";
import { offeredServices } from "@/data/offer";
import { placeName } from "@/data/algeria";
import { CARE_UNIT_KEY, DOG_SIZES, localized, type SitterProfile } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/utils/dates";
import { formatDZD, formatList } from "@/utils/format";

/**
 * The public sitter profile — ONE component.
 *
 * The audit requires the sitter's own preview to show "exactement le même
 * profil" the owner sees, so there is exactly one implementation and the
 * preview embeds it. That is also why this component owns no layout chrome:
 * no container, no measure, no sticky bar, no `<Helmet>`. The page supplies
 * those, because the owner page and the preview inside `FlowScreen` supply
 * different ones.
 *
 * AUDIT 1.3 LOT 06 — READABLE IN A FEW SECONDS. The first mobile screen now
 * answers "for which animal, which service, at what price, and why me" before
 * anything else:
 *
 *   lede       photo or monogram · name · commune · why this fits (when the
 *              visitor searched) · AT A GLANCE: animals and dog sizes taken,
 *              every service with its price and unit · the sitter's sentence
 *   folds      (Nidz 1.4 corrections) three sections that open and close,
 *              closed by default, each with an always-visible summary:
 *              how animals are hosted (home facts, then the care details) ·
 *              what I cannot accept — right after, so the two read as one
 *              answer · about (experience folded in)
 *   facts      declared unavailability
 *   evidence   care moments and reviews — both EXAMPLES on a fixture
 *
 * The page's single action ("Demander une garde") is supplied by the caller,
 * pinned on mobile and in a rail on desktop, so it is visible on the first
 * screen without a competing second button.
 *
 * Everything here is category A of the trust architecture: declared by the
 * sitter. There is no rating, no review, no verification and no availability
 * guarantee, because no mechanism produces any of them (§6.1).
 */
export default function SitterProfileView({
  sitter,
  hasCriteria,
  reasons,
  mismatches,
  uncertain = [],
  petName,
  headingLevel = "h1",
  /** Rendered at the end of the lede — the desktop rate rail lives here on the
      owner page and is absent in the preview. */
  ledeAside,
}: {
  sitter: SitterProfile;
  /** Whether the visitor arrived with a search. Passed in rather than derived
      here, so the page and the view cannot disagree about what counts as one —
      a wilaya-only search did, and lost its only explanation. */
  hasCriteria: boolean;
  reasons: MatchReason[];
  /** Things the visitor asked for that this sitter does not offer. */
  mismatches: string[];
  /** Facts the search could not settle — a dog's size that was never given,
      against a sitter who restricts sizes. Neither a match nor a mismatch. */
  uncertain?: string[];
  /** Only pass a name when the criteria still describe THAT animal. */
  petName: string | null;
  headingLevel?: "h1" | "h2";
  ledeAside?: ReactNode;
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  /* Looked up by sitter id rather than passed in, so the preview and the
     public page cannot show different evidence for the same person — which is
     the whole reason this is one component. */
  /* Only the capabilities answered "yes". A "no" is a limit and belongs in
     the limits section; an "unknown" is silence and belongs nowhere. */
  const experienceFacts = (
    [
      ["puppiesKittens", sitter.experience.puppiesKittens],
      ["seniors", sitter.experience.seniors],
      ["specialNeeds", sitter.experience.specialNeeds],
      ["oralMedication", sitter.experience.oralMedication],
      ["multipleAnimals", sitter.experience.multipleAnimals],
      ["reactiveAnimals", sitter.experience.reactiveAnimals],
    ] as const
  )
    .filter(([, value]) => value === "yes")
    .map(([key]) => t(`sitterExperience.${key}.fact`));
  const reviews = sitterReviews(sitter.id);
  const portfolio = sitterPortfolio(sitter.id);

  const Heading = headingLevel;
  /* Sections sit one level below the name, whatever level that is. Fixed at
     h2 they would claim to be siblings of the profile inside an embed whose
     h1 belongs to the surrounding screen. */
  const Section = headingLevel === "h1" ? "h2" : "h3";
  /* Care-block titles sit one level below their section. */
  const BlockHeading = Section === "h2" ? "h3" : "h4";
  const services = offeredServices(sitter);

  /* "Hydra, Alger" — or "Aflou (wilaya)" for a sitter who gave only the
     wilaya, so a large wilaya is not read as its chef-lieu commune. */
  const location = sitter.communeCode
    ? placeName(sitter, lng)
    : (() => {
        const name = placeName(sitter, lng);
        return name ? t("location.wilayaOnly", { name }) : null;
      })();
  const headline = localized(sitter.headline, lng);
  const about = localized(sitter.about, lng);
  /* Two shapes, because "surtout avec : ." is not a sentence. */
  const experienceLine =
    sitter.experience.years > 0
      ? sitter.experience.species.length > 0
        ? t("profile.experienceLine", {
            count: sitter.experience.years,
            species: sitter.experience.species.map((sp) => t(`speciesPlural.${sp}`)).join(" · "),
          })
        : t("profile.experienceYears", { count: sitter.experience.years })
      : "";
  const hasProfession = Boolean(sitter.professional.kind && sitter.professional.kind !== "none");
  /* Every fold starts closed (Nidz 1.4 corrections). */
  const [openFolds, setOpenFolds] = useState<string[]>([]);
  const residentPets =
    sitter.housing.residentPets.length === 0
      ? t("profile.residentPets.none")
      : sitter.housing.residentPets
          .map((p) => t(`profile.residentPets.${p.species}`, { count: p.count }))
          .join(" · ");

  /* AT A GLANCE — the animals, with the dog sizes folded in where they
     belong ("Chiens : petits et moyens"), so the size limit that decides most
     dog requests is never three sections down. */
  /* Nidz 1.7: per category, every breed / species or only the named ones —
     « Chiens (certaines races : Sloughi, Berger allemand) ». */
  const acceptsLine = sitter.acceptedSpecies
    .map((sp) => {
      const acceptance = acceptanceOf(sitter, sp);
      if (!acceptance || acceptance.mode === "all") return t(`speciesPlural.${sp}`);
      const names = [
        ...acceptance.ids.map((id) => getKind(id, sp)?.name[lng]).filter((n): n is string => Boolean(n)),
        ...acceptance.others,
      ];
      return t("profile.glance.someKinds", { animals: t(`speciesPlural.${sp}`), kinds: formatList(names, lng) });
    })
    .join(" · ");

  /* The home, in facts. §14's scale, hairlines only. Species and sizes moved
     to the glance above; what remains describes where the animal would be. */
  const facts: { key: string; label: string; value: string; icon: typeof PawPrint }[] = [
    { key: "max", label: t("profile.facts.max"), value: t("profile.facts.maxValue", { count: sitter.maxAnimals }), icon: PawPrint },
    /* Only when answered: an unanswered housing question must not appear as a
       declaration under "informations fournies par le pet-sitter". */
    ...(sitter.housing.type
      ? [{ key: "housing", label: t("profile.facts.housing"), value: t(`housing.type.${sitter.housing.type}`), icon: HOUSING_ICON[sitter.housing.type] }]
      : []),
    ...(sitter.housing.outdoor
      ? [{ key: "outdoor", label: t("profile.facts.outdoor"), value: t(`housing.outdoor.${sitter.housing.outdoor}`), icon: OUTDOOR_ICON[sitter.housing.outdoor] }]
      : []),
    { key: "pets", label: t("profile.facts.residentPets"), value: residentPets, icon: Heart },
  ];

  /* Blocks with nothing answered are dropped, so the whole section can end
     up empty on a profile whose sitter skipped it. */
  const careBlocks = careLines(sitter.care, sitter.acceptedSpecies, t, lng);

  /* 1.4: the same facts in the same order, each group on its own card.
     Section headings sit one level below the name. */
  const card = "surface p-5 md:p-7";
  const sectionTitle = "text-title font-semibold text-foreground";

  return (
    <div className="space-y-3 md:space-y-4">
      {/* ------------------------------------------------------------ lede */}
      <header className={card}>
        <div className="flex items-center gap-4">
          {/* The sitter's own photograph when they added one — theirs to
              publish; otherwise the terracotta monogram carried over from the
              results card. Never a stock portrait (§21, §40). */}
          {sitter.photoUrl ? (
            <img src={sitter.photoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover md:size-20" />
          ) : (
            sitter.publicName && (
              <span
                aria-hidden="true"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-semibold text-brand md:size-20 md:text-3xl"
              >
                {sitter.publicName.charAt(0)}
              </span>
            )
          )}
          <div className="min-w-0">
            <Heading className={cn("font-semibold text-foreground", headingLevel === "h1" ? "text-h1 md:text-h1-lg" : "text-title")}>
              <bdi>{sitter.publicName}</bdi>
            </Heading>
            {/* Omitted rather than rendered empty: a lone MapPin over nothing
                is decoration to sighted users and silence to assistive tech. */}
            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-base text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <bdi>{location}</bdi>
              </p>
            )}
          </div>
        </div>

        {headline && <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-foreground">{headline}</p>}

        {/* AT A GLANCE: for which animals, which services, at what price. A
            menu, not a pricing grid — body scale, the unit always beside the
            amount (§19, Audit 1.3 LOT 03). */}
        {(acceptsLine || services.length > 0) && (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {acceptsLine && (
              <div className="rounded-lg bg-muted p-4">
                <dt className="text-sm text-muted-foreground">{t("profile.facts.species")}</dt>
                <dd className="mt-2 flex items-center gap-3">
                  <span aria-hidden="true" className="flex shrink-0 -space-x-2 rtl:space-x-reverse">
                    {sitter.acceptedSpecies.map((sp) => (
                      <AnimalPortrait key={sp} species={sp} className="size-9 rounded-full ring-2 ring-card" />
                    ))}
                  </span>
                  <span className="text-base font-semibold text-foreground">{acceptsLine}</span>
                </dd>
              </div>
            )}
            {services.length > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <dt className="text-sm text-muted-foreground">{t("profile.glance.services")}</dt>
                <dd className="mt-2 space-y-2.5">
                  {services.map((service) => {
                    const Icon = CARE_ICON[service];
                    return (
                      /* Service and price share a line while they fit, and
                         the price drops UNDER the service when they do not
                         (flex-wrap) — the price used to be `shrink-0`, so in a
                         narrow tile the service name was squeezed to one word
                         and "Promenade" ran into "600 DA". The amount and its
                         unit each stay whole; the unit may wrap after the
                         amount rather than overflow. */
                      <p key={service} className="flex items-start gap-2.5 text-[0.9375rem] text-foreground">
                        <Icon className="mt-0.5 size-[1.125rem] shrink-0 text-primary" aria-hidden="true" />
                        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <span className="min-w-0 break-words">{t(`care.${service}`)}</span>
                          <span className="sr-only"> · </span>
                          <span className="max-w-full">
                            <span className="whitespace-nowrap font-semibold tabular-nums">
                              {formatDZD(sitter.rates[service] as number, lng)}
                            </span>{" "}
                            <span className="text-sm text-muted-foreground">{t(CARE_UNIT_KEY[service])}</span>
                          </span>
                        </span>
                      </p>
                    );
                  })}
                </dd>
              </div>
            )}
          </dl>
        )}
        {/* True today and commits to nothing: §28 says the payment model is
            explicitly unvalidated, so this must not imply one. */}
        {services.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{t("profile.noPayment")}</p>}

        {/* Scopes the whole page: everything below is what this person says
            about themselves. Shown here, and again only where a claim needs it
            most — six copies would be the badge cascade §7 forbids. */}
        <ProvenanceLabel className="mt-4" />
      </header>

      {/* Why this fits — only when the visitor searched, and only what the
          sitter's own data supports. The heading names what is actually
          underneath it: a section holding only a mismatch, or only ABSENCES
          ("has not declared these dates unavailable"), must not be titled
          "Bien adapté à Milo" (see `isAbsenceReason`). */}
      {hasCriteria && (reasons.length > 0 || mismatches.length > 0 || uncertain.length > 0) && (
        <section className={card}>
          <Section className={sectionTitle}>
            {!reasons.some((r) => !isAbsenceReason(r))
              ? t("profile.mismatchTitle")
              : petName
                ? t("profile.section.fitNamed", { name: petName })
                : t("profile.section.fit")}
          </Section>
          <MatchReasonList className="mt-3" reasons={reasons} />
          {uncertain.map((line) => (
            <p key={line} className="mt-3 max-w-[64ch] text-sm font-medium text-foreground">
              {line}
            </p>
          ))}
          {mismatches.length > 0 && (
            <div className="mt-3">
              {reasons.some((r) => !isAbsenceReason(r)) && (
                <p className="text-sm font-medium text-foreground">{t("profile.mismatchTitle")}</p>
              )}
              <MismatchList className={reasons.some((r) => !isAbsenceReason(r)) ? "mt-2" : ""} items={mismatches} />
            </div>
          )}
        </section>
      )}

      {ledeAside}

      {/* ------------------------------------------------- the three folds
          Nidz 1.4 corrections: "Comment j'accueille les animaux" (what I can
          take, and how), "Ce que je ne peux pas accepter" and "À propos" open
          and close, closed by default. Each keeps its essentials in a summary
          that is visible while it is closed — the home and how many animals
          at once, the first thing the sitter cannot accept — so a decisive
          restriction is never one tap away (see `ProfileFold`). The glance
          above already carries the animals, dog sizes, services and prices.

          The pair "what I accept / what I cannot accept" stays together and
          before "À propos", as Audit 1.3 LOT 06 ordered. */}
      <ProfileFolds value={openFolds} onValueChange={setOpenFolds}>
        {/* How animals are hosted: the home in facts, then the care details in
            sentences (§57), under one heading. */}
        <ProfileFold
          value="care"
          open={openFolds.includes("care")}
          heading={Section}
          title={t("profile.section.care")}
          summary={<p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{facts.map((f) => f.value).join(" · ")}</p>}
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map(({ key, label, value, icon: Icon }) => (
              <div key={key} className="flex items-start gap-3 rounded-lg bg-muted p-3.5">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-pill">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-[0.9375rem] font-medium text-foreground">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          {/* Only ANSWERED questions: `careLines` drops the rest rather than
              printing "not specified" twenty times (§118). */}
          {careBlocks.length > 0 && (
            <div className="mt-6 max-w-[64ch] space-y-5">
              {careBlocks.map((block) => (
                <div key={block.id}>
                  <BlockHeading className="text-[0.9375rem] font-semibold text-foreground">{block.title}</BlockHeading>
                  <ul role="list" className="mt-1.5 space-y-1.5">
                    {block.lines.map((line, i) => (
                      <li key={i} className="text-base leading-relaxed text-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {sitter.housing.conditions && localized(sitter.housing.conditions, lng) && (
            <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-foreground">
              {localized(sitter.housing.conditions, lng)}
            </p>
          )}
          {/* One provenance line for the whole section, not one per fact. */}
          <p className="mt-4 max-w-[64ch] text-sm text-muted-foreground">{t("profile.care.declaredNote")}</p>
        </ProfileFold>

        {/* Omitted when empty — "aucune limite indiquée" would state that this
            person accepts everything, which they never said. No red, no
            warning icon: a sitter declining an animal their home does not
            suit is the matching working (§12.1). Closed, the FIRST limit is
            shown whole (never cut mid-sentence: a half restriction reads as a
            different one) and the rest are counted. */}
        {sitter.limits.length > 0 && (
          <ProfileFold
            value="limits"
            open={openFolds.includes("limits")}
            heading={Section}
            title={t("profile.section.limits")}
            summary={
              <div className="max-w-[64ch]">
                <p className="flex gap-3 text-base leading-relaxed text-foreground">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span className="min-w-0">{localized(sitter.limits[0], lng)}</span>
                </p>
                {sitter.limits.length > 1 && (
                  <p className="mt-1.5 ps-[1.125rem] text-sm font-medium text-muted-foreground">
                    {t("profile.moreLimits", { count: sitter.limits.length - 1 })}
                  </p>
                )}
              </div>
            }
          >
            <p className="max-w-[64ch] text-sm text-muted-foreground">{t("profile.limitsIntro")}</p>
            <ul role="list" className="mt-4 max-w-[64ch] space-y-3">
              {sitter.limits.map((limit, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed text-foreground">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span className="min-w-0">{localized(limit, lng)}</span>
                </li>
              ))}
            </ul>
          </ProfileFold>
        )}

        {/* ----------------------------------------------------- narrative
            Omitted when the sitter has said nothing about themselves: a fold
            that opens onto nothing is a broken promise. */}
        {(about || experienceLine || hasProfession || experienceFacts.length > 0) && (
          <ProfileFold
            value="about"
            open={openFolds.includes("about")}
            heading={Section}
            title={t("profile.section.about")}
            summary={
              (about || experienceLine) && (
                /* A teaser of the sitter's own words — two lines, the rest a
                   tap away. Nothing in "À propos" is a restriction, so
                   clamping it hides no decision. */
                <p className="line-clamp-2 max-w-[64ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {about || experienceLine}
                </p>
              )
            }
          >
            {about && <p className="max-w-[64ch] text-base leading-relaxed text-foreground">{about}</p>}
            {experienceLine && (
              <p className={cn("max-w-[64ch] text-base leading-relaxed text-muted-foreground", about && "mt-3")}>{experienceLine}</p>
            )}
            {/* A DECLARED profession (§40). The label says who said it, and the
                wording never upgrades on its own: naming a profession is not a
                credential, and there is no check behind it in Nidz (§68). */}
            {hasProfession && (
              <div className={cn("rounded-lg bg-muted p-4", (about || experienceLine) && "mt-4")}>
                <p className="max-w-[64ch] text-base font-medium text-foreground">
                  {t(`profession.${sitter.professional.kind}`)}
                  {sitter.professional.years !== null && (
                    <span className="font-normal text-muted-foreground">
                      {" · "}
                      {t("profile.professionalYears", { count: sitter.professional.years })}
                    </span>
                  )}
                </p>
                {localized(sitter.professional.detail, lng) && (
                  <p className="mt-1 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
                    {localized(sitter.professional.detail, lng)}
                  </p>
                )}
                <p className="mt-1.5 max-w-[64ch] text-sm text-muted-foreground">{t("profile.professionalUnverified")}</p>
              </div>
            )}

            {/* The §54 answers the sitter actually gave ("yes" only). */}
            {experienceFacts.length > 0 && (
              <ul role="list" className={cn("flex flex-wrap gap-2", (about || experienceLine || hasProfession) && "mt-4")}>
                {experienceFacts.map((fact) => (
                  <li key={fact} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                    {fact}
                  </li>
                ))}
              </ul>
            )}
          </ProfileFold>
        )}
      </ProfileFolds>

      <section className={card}>
        <div className="flex items-center gap-2.5">
          <CalendarOff className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Section className={sectionTitle}>{t("profile.section.unavailable")}</Section>
        </div>
        {sitter.declaredUnavailable.length > 0 ? (
          <ul role="list" className="mt-4 flex flex-wrap gap-2">
            {sitter.declaredUnavailable.map((range) => (
              <li key={`${range.start}-${range.end}`} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                <bdi>{formatDateRange(range, lng)}</bdi>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 max-w-[64ch] text-base text-muted-foreground">{t("profile.unavailableNone")}</p>
        )}
        {/* Phrased once in the product: not-declared-busy is not a
            reservation. */}
        <p className="mt-3 max-w-[64ch] text-sm text-muted-foreground">{t("need.care.availabilityNote")}</p>
        <ProvenanceLabel className="mt-3" />
      </section>

      {/* COMMUNITY evidence, and the absence of it — last, because it
          qualifies everything above rather than replacing it. Both are absent
          for a profile the visitor built themselves, and the review section
          says so rather than disappearing. */}
      <PortfolioSection items={portfolio} isDemoFixture={sitter.isDemoFixture} headingLevel={Section} />

      <ReviewSection
        headingLevel={Section}
        reviews={reviews}
        sitterName={sitter.publicName}
        isDemoFixture={sitter.isDemoFixture}
      />
    </div>
  );
}

/** The rate to quote in a sticky bar or a rail: the service the owner asked
    for when they asked for one, otherwise the cheapest on offer. */
export function QuotedRate({
  amount,
  careType,
  isFrom,
  compact = false,
  className,
}: {
  amount: number;
  careType: keyof typeof CARE_UNIT_KEY;
  isFrom: boolean;
  /** Stacked, smaller labels around the amount — for the floating pill. */
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  if (compact) {
    return (
      <p className={cn("min-w-0 whitespace-nowrap leading-tight", className)}>
        {/* Never truncated: "à partir de" qualifies the amount, and an
            amount without its qualifier says something false. */}
        {isFrom && <span className="block text-xs text-muted-foreground">{t("search.card.from")}</span>}
        <span className="block text-lg font-semibold tabular-nums text-foreground">{formatDZD(amount, lng)}</span>
        <span className="block text-xs text-muted-foreground">{t(CARE_UNIT_KEY[careType])}</span>
      </p>
    );
  }
  return (
    <p className={cn("min-w-0", className)}>
      {isFrom && <span className="text-sm text-muted-foreground">{t("search.card.from")} </span>}
      <span className="text-price font-semibold tabular-nums text-foreground">{formatDZD(amount, lng)}</span>{" "}
      <span className="whitespace-nowrap text-sm text-muted-foreground">{t(CARE_UNIT_KEY[careType])}</span>
    </p>
  );
}
