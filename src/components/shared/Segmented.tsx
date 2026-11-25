import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   SEGMENTED VIEWS (Nidz 1.7) — the one control for « two or three views of
   one place »: Mes animaux / Explorer, Reçues / Envoyées / Validées,
   Conversations / Notifications.

   Tabs semantics (arrow keys, Home / End, one tab stop), and the view is
   owned by the caller — every caller keeps it in the ADDRESS, so Back returns
   to the view the person left (NAV-03).

   Motion: one capsule slides under the labels (transform + width, 220ms,
   strong ease-out) instead of each tab fading its own background. A single
   moving object reads as « the same control, another view »; it is retargeted
   mid-flight because it is a transition, not a keyframe. Under reduced motion
   it jumps.
   ------------------------------------------------------------------------ */

export type SegmentItem<K extends string> = {
  key: K;
  label: string;
  /** A number of things waiting, announced in words by `countLabel`. */
  count?: number;
  countLabel?: string;
};

export default function Segmented<K extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  className,
  stretch = false,
  equal = true,
}: {
  items: readonly SegmentItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Accessible name of the tab list. */
  label: string;
  /** Prefix of the tab and panel ids: `${idPrefix}-tab-${key}`. */
  idPrefix: string;
  className?: string;
  /** Fill the width — each tab an equal share, or (`equal={false}`) a share
      sized by its label, for two labels of very different length. */
  stretch?: boolean;
  equal?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      setIndicator({ x: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value, items]);

  const move = (from: number, delta: number | "first" | "last") => {
    const index =
      delta === "first" ? 0 : delta === "last" ? items.length - 1 : (from + delta + items.length) % items.length;
    const next = items[index];
    onChange(next.key);
    document.getElementById(`${idPrefix}-tab-${next.key}`)?.focus();
  };

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className={cn(
        "relative isolate max-w-full rounded-full bg-card p-1 shadow-pill",
        stretch ? cn("grid grid-flow-col", equal ? "auto-cols-fr" : "auto-cols-auto") : "inline-flex",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 -z-10 rounded-full bg-primary-soft transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: indicator.width,
            /* offsetLeft is measured from the physical left in both
               directions, so the capsule is anchored on the physical left
               too — correct in Arabic without a direction branch. */
            left: 0,
            transform: `translateX(${indicator.x}px)`,
          }}
        />
      )}
      {items.map((item, index) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => {
              const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
              if (event.key === "ArrowRight") move(index, rtl ? -1 : 1);
              else if (event.key === "ArrowLeft") move(index, rtl ? 1 : -1);
              else if (event.key === "Home") move(index, "first");
              else if (event.key === "End") move(index, "last");
              else return;
              event.preventDefault();
            }}
            className={cn(
              "relative inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm transition-colors duration-150 sm:px-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              /* Before the first measurement the capsule is not drawn yet:
                 the selected tab carries its own ground so nothing flashes. */
              selected && !indicator && "bg-primary-soft",
              selected ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <>
                <span
                  aria-hidden="true"
                  className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
                >
                  {item.count}
                </span>
                {item.countLabel && <span className="sr-only">{item.countLabel}</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The panel a `Segmented` controls. */
export function SegmentPanel({
  idPrefix,
  activeKey,
  children,
  className,
}: {
  idPrefix: string;
  activeKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${activeKey}`} className={className}>
      {children}
    </div>
  );
}
