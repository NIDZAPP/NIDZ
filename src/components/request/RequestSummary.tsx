import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, UserRound, Wallet } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { petFacts } from "@/components/request/pet-facts";
import StatusBadge from "@/components/shared/StatusBadge";
import { ProvenanceLabel } from "@/components/shared/trust";
import { communeWithWilaya } from "@/data/algeria";
import { kindLabel } from "@/data/pets";
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
  bare = false,
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
  /** No card of its own — for a caller that already puts it on one. */
  bare?: boolean;
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
  const facts = pet ? petFacts(pet, t, lng) : [];

  /* 1.4: the request as a PASS — the animal on top, then labelled
     segments, like a ticket you could hand over. It states what was ASKED;
     nothing on it reads as confirmed (no stamp, no seat, no booking). */
  const segments: { key: string; label: string; value: string; icon: typeof CalendarDays; wide?: boolean }[] = [
    { key: "sitter", label: t("request.summary.sitter"), value: sitterName, icon: UserRound },
    { key: "care", label: t("request.summary.care"), value: t(`care.${request.careType}`), icon: CARE_ICON[request.careType] },
    { key: "dates", label: t("request.summary.dates"), value: formatDateRange(request.dates, lng), icon: CalendarDays, wide: true },
    ...(ownerZone ? [{ key: "zone", label: t("request.summary.ownerZone"), value: ownerZone, icon: MapPin }] : []),
    ...(request.displayedRate
      ? [
          {
            key: "rate",
            label: t("request.summary.rate"),
            value: `${formatDZD(request.displayedRate.amount, lng)} ${t(CARE_UNIT_KEY[request.displayedRate.careType])}`,
            icon: Wallet,
          },
        ]
      : []),
  ];
  const kind = pet ? kindLabel(pet, lng) : null;

  return (
    <div className={cn(!bare && "surface overflow-hidden", className)}>
      {/* The animal, first: it is what the request is about. */}
      <div className={cn("flex items-center gap-3.5", bare ? "pb-4" : "p-5 pb-4")}>
        {pet ? (
          <AnimalPortrait species={pet.species} className="size-14 shrink-0 rounded-full" />
        ) : (
          <span aria-hidden="true" className="size-14 shrink-0 rounded-full bg-secondary" />
        )}
        <div className="min-w-0 flex-1">
          {pet ? (
            <>
              <p className="truncate text-name font-semibold text-foreground">
                <bdi>{pet.name}</bdi>
              </p>
              {/* Each part isolated: a breed or an age is the owner's own text
                  ("3 ans") and may be Latin inside Arabic. */}
              <p className="truncate text-sm text-muted-foreground">
                {[t(`species.${pet.species}`), kind, pet.age].filter(Boolean).map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    <bdi>{part}</bdi>
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("request.summary.pet")}</p>
          )}
        </div>
        {showStatus && <StatusBadge status={request.status} className="shrink-0" />}
      </div>

      {/* The tear line of a pass: a dashed rule with a notch at each end. */}
      <div aria-hidden="true" className={cn("relative", !bare && "mx-5")}>
        <div className="border-t-2 border-dashed border-border" />
        {!bare && (
          <>
            <span className="absolute -start-8 -top-3 size-6 rounded-full bg-background" />
            <span className="absolute -end-8 -top-3 size-6 rounded-full bg-background" />
          </>
        )}
      </div>

      <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-4", bare ? "py-4" : "p-5")}>
        {segments.map(({ key, label, value, icon: Icon, wide }) => (
          <div key={key} className={cn("min-w-0", wide && "col-span-2")}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </dt>
            <dd className={cn("mt-1 text-[0.9375rem] font-semibold text-foreground", key === "rate" && "tabular-nums")}>
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>

      {/* What the owner said about THIS animal. Collected on the pet screen
          under an explicit promise that it helps a sitter judge whether they
          can take it — so it has to arrive. */}
      {pet && (facts.length > 0 || pet.notes) && (
        <div className={cn("space-y-4 rounded-lg bg-muted p-4", !bare && "mx-5 mb-5")}>
          {facts.length > 0 && (
            <div>
              <Heading className="text-[0.9375rem] font-semibold text-foreground">
                {t("request.summary.aboutPet", { name: pet.name })}
              </Heading>
              <dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.key} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 sm:block">
                    <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                    <dd className="text-[0.9375rem] text-foreground">
                      <bdi>{fact.value}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {/* The needs travel with the request: they are what a sitter most
              needs in order to answer honestly. */}
          {pet.notes && (
            <div>
              <Heading className="text-[0.9375rem] font-semibold text-foreground">{t("request.summary.needs")}</Heading>
              <p dir="auto" className="mt-1.5 max-w-[64ch] text-base leading-relaxed text-foreground">{pet.notes}</p>
            </div>
          )}
        </div>
      )}

      {request.displayedRate && (
        /* Whose number this is, and what it is not. */
        <ProvenanceLabel className={cn(bare ? "pb-1" : "px-5 pb-5")}>
          {` · ${t("profile.noPayment")}`}
        </ProvenanceLabel>
      )}
    </div>
  );
}
