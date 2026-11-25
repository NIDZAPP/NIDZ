import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { photoToDataUrl } from "@/utils/photo";

/* ---------------------------------------------------------------------------
   A PHOTOGRAPH, CHOSEN ON THE DEVICE (Nidz 1.7 §8.3, §3) — preview, replace,
   remove.

   Optional everywhere it appears, and it says so. The file never leaves the
   device: it is reduced to a small JPEG (`utils/photo.ts`) and kept in this
   browser, which the line under the control states in words. While the image
   is being prepared the button says so and cannot be pressed twice; a file
   that is not an image, or cannot be read, is refused with the reason.

   The preview is the person's own picture. Where there is none, the caller's
   `placeholder` is drawn — the catalogue illustration for an animal, a
   monogram for a person — and it is never mistaken for a photo: the label
   under it says « Aucune photo ».
   ------------------------------------------------------------------------ */

export default function PhotoField({
  label,
  value,
  onChange,
  placeholder,
  shape = "rounded",
  help,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  placeholder: ReactNode;
  shape?: "rounded" | "circle";
  help?: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => input.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await photoToDataUrl(file);
    setBusy(false);
    if ("dataUrl" in result) onChange(result.dataUrl);
    else setError(t(result.reason === "type" ? "photo.errorType" : "photo.errorRead"));
  };

  const frame = cn(
    "relative size-24 shrink-0 overflow-hidden bg-secondary shadow-card",
    shape === "circle" ? "rounded-full" : "rounded-2xl",
  );

  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="text-[0.9375rem] font-medium text-foreground">
        {label} <span className="font-normal text-muted-foreground">· {t("common.optional")}</span>
      </p>
      <div className="mt-3 flex items-center gap-4">
        <div className={frame}>
          {value ? (
            <img src={value} alt={t("photo.previewAlt")} className="size-full object-cover" />
          ) : (
            <div className="size-full">{placeholder}</div>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-card/70">
              <Loader2 className="size-6 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {!value && <span className="text-sm text-muted-foreground">{t("photo.none")}</span>}
          <Button type="button" variant="surface" onClick={pick} disabled={busy} aria-describedby={`${id}-help`}>
            {busy ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : value ? (
              <Camera aria-hidden="true" />
            ) : (
              <ImagePlus aria-hidden="true" />
            )}
            {busy ? t("photo.preparing") : value ? t("photo.replace") : t("photo.add")}
          </Button>
          {value && !busy && (
            <Button type="button" variant="ghost" className="-ms-2 text-muted-foreground" onClick={() => onChange(null)}>
              <Trash2 aria-hidden="true" />
              {t("photo.remove")}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          /* The same file chosen twice still fires `change`. */
          e.target.value = "";
        }}
      />
      <p id={`${id}-help`} className="mt-2 text-sm text-muted-foreground">
        {help ?? t("photo.localNote")}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
