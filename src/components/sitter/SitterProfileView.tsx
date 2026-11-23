import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { careLines } from "@/components/sitter/care-lines";
import { MatchReasonList, MismatchList } from "@/components/sitter/match";
import { ProvenanceLabel } from "@/components/shared/trust";
import PortfolioSection from "@/components/sitter/PortfolioSection";
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
 *   limits     what I cannot accept — right after what I do accept, so the
 *              two read as one answer
 *   narrative  about (experience folded in) · how animals are hosted (home
 *              facts, then the care details)
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
  const residentPets =
    sitter.housing.residentPets.length === 0
      ? t("profile.residentPets.none")
      : sitter.housing.residentPets
          .map((p) => t(`profile.residentPets.${p.species}`, { count: p.count }))
          .join(" · ");

  /* AT A GLANCE — the animals, with the dog sizes folded in where they
     belong ("Chiens : petits et moyens"), so the size limit that decides most
     dog requests is never three sections down. */
  const dogSizes = DOG_SIZES.filter((size) => sitter.acceptedDogSizes.includes(size));
  const acceptsLine = sitter.acceptedSpecies
    .map((sp) => {
      if (sp !== "dog" || dogSizes.length === 0) return t(`speciesPlural.${sp}`);
      return dogSizes.length === DOG_SIZES.length
        ? t("profile.glance.dogsAllSizes")
        : t("profile.glance.dogsSizes", { sizes: formatList(dogSizes.map((size) => t(`sizeShort.${size}`)), lng) });
    })
    .join(" · ");

  /* The home, in facts. §14's scale, hairlines only. Species and sizes moved
     to the glance above; what remains describes where the animal would be. */
  const facts: { key: string; label: string; value: string }[] = [
    { key: "max", label: t("profile.facts.max"), value: t("profile.facts.maxValue", { count: sitter.maxAnimals }) },
    /* Only when answered: an unanswered housing question must not appear as a
       declaration under "informations fournies par le pet-sitter". */
    ...(sitter.housing.type
      ? [{ key: "housing", label: t("profile.facts.housing"), value: t(`housing.type.${sitter.housing.type}`) }]
      : []),
    ...(sitter.housing.outdoor
      ? [{ key: "outdoor", label: t("profile.facts.outdoor"), value: t(`housing.outdoor.${sitter.housing.outdoor}`) }]
      : []),
    { key: "pets", label: t("profile.facts.residentPets"), value: residentPets },
  ];

  /* Blocks with nothing answered are dropped, so the whole section can end
     up empty on a profile whose sitter skipped it. */
  const careBlocks = careLines(sitter.care, sitter.acceptedSpecies, t, lng);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* ------------------------------------------------------------ lede */}
      <header>
        <div className="flex items-start gap-4">
          {/* The sitter's own photograph when they added one — theirs to
              publish; otherwise a monogram at card scale, which reads as the
              recognition mark carried over from the results row. Never a stock
              portrait (§21, §40). */}
          {sitter.photoUrl ? (
            <img
              src={sitter.photoUrl}
              alt=""
              className="size-12 shrink-0 rounded-sm object-cover md:size-14"
            />
          ) : (
            sitter.publicName && (
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-name font-semibold text-brand md:size-14"
              >
                {sitter.publicName.charAt(0)}
              </span>
            )
          )}
          <div className="min-w-0">
            <Heading className={cn("font-semibold text-foreground", headingLevel === "h1" ? "text-h1 md:text-h1-lg" : "text-name")}>
              <bdi>{sitter.publicName}</bdi>
            </Heading>
            {/* Omitted rather than rendered empty: a lone MapPin over nothing
                is decoration to sighted users and silence to assistive tech. */}
            {location && (
              <p className="mt-2 flex items-center gap-1.5 text-base text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <bdi>{location}</bdi>
              </p>
            )}
          </div>
        </div>

        {/* Why this fits — only when the visitor searched, and only what the
            sitter's own data supports. The heading names what is actually
            underneath it: a section holding only a mismatch, or only ABSENCES
            ("has not declared these dates unavailable"), must not be titled
            "Bien adapté à Milo" (see `isAbsenceReason`). */}
        {hasCriteria && (reasons.length > 0 || mismatches.length > 0 || uncertain.length > 0) && (
          <div className="mt-6">
            <Section className="text-base font-semibold text-foreground">
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
                <MismatchList
                  className={reasons.some((r) => !isAbsenceReason(r)) ? "mt-2" : ""}
                  items={mismatches}
                />
              </div>
            )}
          </div>
        )}

        {/* AT A GLANCE: for which animals, which services, at what price. A
            menu, not a pricing grid — body scale, the unit always beside the
            amount (§19, Audit 1.3 LOT 03). */}
        {(acceptsLine || services.length > 0) && (
          <dl className="mt-6 grid gap-x-8 gap-y-4 border-y border-border py-4 sm:grid-cols-2">
            {acceptsLine && (
              <div>
                <dt className="text-sm text-muted-foreground">{t("profile.facts.species")}</dt>
                <dd className="mt-1 text-base font-medium text-foreground">{acceptsLine}</dd>
              </div>
            )}
            {services.length > 0 && (
              <div>
                <dt className="text-sm text-muted-foreground">{t("profile.glance.services")}</dt>
                <dd className="mt-1 space-y-1">
                  {services.map((service) => (
                    <p key={service} className="text-base text-foreground">
                      {t(`care.${service}`)}
                      {" · "}
                      <span className="font-semibold tabular-nums">{formatDZD(sitter.rates[service] as number, lng)}</span>{" "}
                      <span className="text-muted-foreground">{t(CARE_UNIT_KEY[service])}</span>
                    </p>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
        {/* True today and commits to nothing: §28 says the payment model is
            explicitly unvalidated, so this must not imply one. */}
        {services.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{t("profile.noPayment")}</p>}

        {headline && (
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-foreground">{headline}</p>
        )}

        {/* Scopes the whole page: everything below is what this person says
            about themselves. Shown here, and again only where a claim needs it
            most — six copies would be the badge cascade §7 forbids. */}
        <ProvenanceLabel className="mt-4" />

        {ledeAside}
      </header>

      {/* Directly after what the sitter accepts, so the pair reads as one
          complete answer rather than as a caveat buried at the bottom.
          Omitted when empty — "aucune limite indiquée" would state that this
          person accepts everything, which they never said. No red, no warning
          icon: a sitter declining an animal their home does not suit is the
          matching working (§12.1). */}
      {sitter.limits.length > 0 && (
        <section>
          <Section className="text-name font-semibold text-foreground">{t("profile.section.limits")}</Section>
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">{t("profile.limitsIntro")}</p>
          <ul role="list" className="mt-4 max-w-[64ch] space-y-2">
            {sitter.limits.map((limit, i) => (
              <li key={i} className="text-base leading-relaxed text-foreground">
                {localized(limit, lng)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------- narrative */}
      <section>
        <Section className="text-name font-semibold text-foreground">{t("profile.section.about")}</Section>
        {about && <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-foreground">{about}</p>}
        {/* Experience is a sentence, not a section — a number, a species list
            and one optional line do not need a heading of their own. */}
        {/* Two shapes, because "surtout avec : ." is not a sentence. */}
        {sitter.experience.years > 0 && (
          <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
            {sitter.experience.species.length > 0
              ? t("profile.experienceLine", {
                  count: sitter.experience.years,
                  species: sitter.experience.species.map((sp) => t(`speciesPlural.${sp}`)).join(" · "),
                })
              : t("profile.experienceYears", { count: sitter.experience.years })}
          </p>
        )}
        {/* A DECLARED profession (§40). The label says who said it, and the
            wording never upgrades on its own: naming a profession is not a
            credential, and there is no check behind it in Nidz (§68). "None"
            and "not answered" both render as nothing — an absence is not a
            claim either way. */}
        {sitter.professional.kind && sitter.professional.kind !== "none" && (
          <div className="mt-3">
            <p className="max-w-[64ch] text-base text-foreground">
              {t(`profession.${sitter.professional.kind}`)}
              {sitter.professional.years !== null && (
                <span className="text-muted-foreground">
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
            <p className="mt-1 max-w-[64ch] text-sm text-muted-foreground">
              {t("profile.professionalUnverified")}
            </p>
          </div>
        )}

        {/* The §54 answers the sitter actually gave. Unanswered ones are
            omitted rather than listed as "I don't know": a short list of
            capabilities is useful, nine rows of uncertainty are not. */}
        {experienceFacts.length > 0 && (
          <ul role="list" className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {experienceFacts.map((fact) => (
              <li key={fact} className="text-base text-foreground">
                {fact}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How animals are hosted: the home in facts, then the care details in
          sentences (§57). Grouped under one heading, so the reader finds
          "where would my animal be, and how would its day go" in one place
          rather than across a facts table and a separate narrative. */}
      <section>
        <Section className="text-name font-semibold text-foreground">{t("profile.section.care")}</Section>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.key}>
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 text-base text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
        {/* Only ANSWERED questions: `careLines` drops the rest rather than
            printing "not specified" twenty times (§118). */}
        {careBlocks.length > 0 && (
          <div className="mt-8 max-w-[64ch] space-y-6">
            {careBlocks.map((block) => (
              <div key={block.id}>
                <BlockHeading className="text-sm font-semibold text-foreground">{block.title}</BlockHeading>
                <ul role="list" className="mt-2 space-y-1.5">
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
          <p className="mt-6 max-w-[64ch] text-base leading-relaxed text-foreground">
            {localized(sitter.housing.conditions, lng)}
          </p>
        )}
        {/* One provenance line for the whole section, not one per fact. */}
        <p className="mt-4 max-w-[64ch] text-sm text-muted-foreground">{t("profile.care.declaredNote")}</p>
      </section>

      <section>
        <Section className="text-name font-semibold text-foreground">{t("profile.section.unavailable")}</Section>
        {sitter.declaredUnavailable.length > 0 ? (
          <ul role="list" className="mt-4 space-y-1.5">
            {sitter.declaredUnavailable.map((range) => (
              <li key={`${range.start}-${range.end}`} className="text-base text-foreground">
                <bdi>{formatDateRange(range, lng)}</bdi>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-[64ch] text-base text-muted-foreground">{t("profile.unavailableNone")}</p>
        )}
        {/* The same sentence the need flow uses, so the caveat is phrased once
            in the product: not-declared-busy is not a reservation. */}
        <p className="mt-3 max-w-[64ch] text-sm text-muted-foreground">{t("need.care.availabilityNote")}</p>
        <ProvenanceLabel className="mt-4" />
      </section>

      {/* COMMUNITY evidence, and the absence of it.

          Reviews come last because they qualify everything above rather than
          replacing it: a reader who has just seen what this person declares is
          in a position to weigh what other people said about it. The portfolio
          sits with them because both answer "what is this actually like",
          which the declarations cannot.

          Both are absent for a profile the visitor built themselves — the
          honest state of a sitter nobody has used yet — and the review section
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
  className,
}: {
  amount: number;
  careType: keyof typeof CARE_UNIT_KEY;
  isFrom: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  return (
    <p className={cn("min-w-0", className)}>
      {isFrom && <span className="text-sm text-muted-foreground">{t("search.card.from")} </span>}
      <span className="text-price font-semibold tabular-nums text-foreground">{formatDZD(amount, lng)}</span>{" "}
      <span className="whitespace-nowrap text-sm text-muted-foreground">{t(CARE_UNIT_KEY[careType])}</span>
    </p>
  );
}
