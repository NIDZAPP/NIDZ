import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { unreadThreads } from "@/data/notifications";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

/**
 * The way to Messages, in the header of both spaces (Nidz 1.4). A round pill
 * like every bar control, with the number of conversations this space has
 * not opened since the other side wrote — in the accessible name as words,
 * and as a teal badge. Never a read receipt: see src/data/conversations.ts.
 */
export default function MessagesButton() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const count = unreadThreads(state, state.activeWorkspace);
  return (
    <NavLink
      to="/messages"
      aria-label={t("nav.messagesUnread", { count })}
      className={({ isActive }) =>
        cn(
          "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-pill transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive ? "text-primary" : "text-foreground hover:bg-secondary",
        )
      }
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 flex min-w-5 animate-pop items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] font-bold leading-5 text-primary-foreground ring-2 ring-background"
        >
          {count}
        </span>
      )}
    </NavLink>
  );
}
