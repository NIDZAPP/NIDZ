import { Bell, FileText, LifeBuoy, MapPin, ShieldCheck, SlidersHorizontal, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** The categories of Paramètres, in order (Nidz 1.7 §23). */
export const SETTINGS_SECTIONS: readonly { id: string; icon: LucideIcon }[] = [
  { id: "security", icon: ShieldCheck },
  { id: "notifications", icon: Bell },
  { id: "preferences", icon: SlidersHorizontal },
  { id: "location", icon: MapPin },
  { id: "help", icon: LifeBuoy },
  { id: "legal", icon: FileText },
  { id: "account", icon: UserCog },
];
