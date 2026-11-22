import { useTranslation } from "react-i18next";

import { petFacts } from "@/components/request/pet-facts";
import StatusBadge from "@/components/shared/StatusBadge";
import { ProvenanceLabel } from "@/components/shared/trust";
import { communeWithWilaya } from "@/data/algeria";
import { CARE_UNIT_KEY, type CareRequest, type SharedPet } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/utils/dates";
import { formatDZD } from "@/utils/format";

/**
 * What is being asked, and of whom.
 *
 * The same component backs the pre-send summary, the success screen, the
 * owner's request detail and the sitter's incoming request — §4.4 says not to
 * make someone remember what they were shown elsewhere, and four hand-written
 * versions of one list would drift apart.
 *
 * The price is what was displayed when the request was made. It is not a
 * total, not a charge and not a commitment: nothing here moves money, and
 * §28 says the payment model is not decided.
 */
export default function RequestSummary({
  request,
  sitterName,
  showStatus = false,
  className,
  /** The needs block is a real content group; give it a heading level that
      fits the page it lands on. */
  headingLevel = "h2",
}: {
  /** `pet` may be null on the pre-send summary only, while the owner is still
      choosing or adding the animal: the rest of the request is shown so the
      sitter, service and dates stay in view (Audit 1.3 LOT 01). A stored
      request always has one. */
  request: Omit<CareRequest, "pet"> & { pet: SharedPet | null };
  sitterName: string;
  showStatus?: boolean;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const Heading = headingLevel;

  /* The owner's area, labelled as such. Unlabelled and sitting under the
     sitter's name, it read as a claim about where the SITTER is. */
  const ownerZone = communeWithWilaya(request.communeCode, lng);

  /* The species-specific answers the owner actually gave. Unanswered questions
     are omitted rather than listed as "I don't know": a short list of facts
     tells a sitter something, nine rows of unknown tell them nothing and stop
     them reading. */
  const pet = request.pet;
  const facts = pet ? petFacts(pet, t) : [];

  const rows: { key: string; label: string; value: string }[] = [
    { key: "sitter", label: t("request.summary.sitter"), value: sitterName },
    ...(pet
      ? [
          {
            key: "pet",
            label: t("request.summary.pet"),
            value: `${pet.name} · ${t(`species.${pet.species}`)}${pet.age ? ` · ${pet.age}` : ""}`,
          },
        ]
      : []),
    { key: "care", label: t("request.summary.care"), value: t(`care.${request.careType}`) },
    { key: "dates", label: t("request.summary.dates"), value: formatDateRange(request.dates, lng) },
    ...(ownerZone
      ? [{ key: "zone", label: t("request.summary.ownerZone"), value: ownerZone }]
      : []),
    ...(request.displayedRate
      ? [
          {
            key: "rate",
            label: t("request.summary.rate"),
            value: `${formatDZD(request.displayedRate.amount, lng)} ${t(
              CARE_UNIT_KEY[request.displayedRate.careType],
            )}`,
          },
        ]
      : []),
  ];

  return (
    <div className={className}>
      {showStatus && (
        <div className="mb-4">
          <StatusBadge status={request.status} />
        </div>
      )}

      <dl className="border-t border-border">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-3"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className={cn("text-base text-foreground", row.key === "rate" && "tabular-nums")}>
              <bdi>{row.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>

      {/* What the owner said about THIS animal. Collected on the pet screen
          under an explicit promise that it helps a sitter judge whether they
          can take it — so it has to arrive. */}
      {pet && facts.length > 0 && (
        <div className="mt-6">
          <Heading className="text-base font-semibold text-foreground">
            {t("request.summary.aboutPet", { name: pet.name })}
          </Heading>
          <dl className="mt-2 border-t border-border">
            {facts.map((fact) => (
              <div
                key={fact.key}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-2.5"
              >
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="text-base text-foreground">
                  <bdi>{fact.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* The needs travel with the request: they are the thing a sitter most
          needs in order to answer honestly. */}
      {pet?.notes && (
        <div className="mt-6">
          {/* The most decision-relevant text a sitter reads. `.eyebrow` is a
              filing label; this is a content heading. */}
          <Heading className="text-base font-semibold text-foreground">
            {t("request.summary.needs")}
          </Heading>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-foreground">{pet.notes}</p>
        </div>
      )}

      {request.displayedRate && (
        /* Whose number this is, and what it is not. */
        <ProvenanceLabel className="mt-4">
          {` · ${t("profile.noPayment")}`}
        </ProvenanceLabel>
      )}
    </div>
  );
}
