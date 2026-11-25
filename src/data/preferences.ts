/* ---------------------------------------------------------------------------
   PREFERENCES (Nidz 1.7 §23) — settings that genuinely change something.

   Every switch here has an effect inside this app, or it does not exist:

     notifications  which events appear in Messages › Notifications and are
                    counted on the tab. Nothing is pushed, e-mailed or sent by
                    SMS — there is no such channel — so these choose what Nidz
                    SHOWS, and the screen says exactly that. The essential
                    account and request events cannot be switched off; the
                    optional ones can, and promotional ones are off by default
                    (and today, there are none to show).
     reduceMotion   removes movement from the interface on top of the system
                    setting, for people who want calm without changing their
                    whole device.
   ------------------------------------------------------------------------ */

export type NotificationTopic =
  | "messages"
  | "requests"
  | "proposals"
  | "updates"
  | "reminders"
  | "opportunities"
  | "promotions";

/** Essential: about something the person is part of — a request, a proposal,
    a decision. Shown whatever the switches say, because missing one can cost
    an animal its care. */
export const ESSENTIAL_TOPICS: readonly NotificationTopic[] = ["requests", "proposals", "updates"];
export const OPTIONAL_TOPICS: readonly NotificationTopic[] = ["messages", "reminders", "opportunities", "promotions"];

export type Preferences = {
  notifications: Record<NotificationTopic, boolean>;
  reduceMotion: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  notifications: {
    messages: true,
    requests: true,
    proposals: true,
    updates: true,
    reminders: true,
    opportunities: true,
    promotions: false,
  },
  reduceMotion: false,
};

export function topicEnabled(preferences: Preferences, topic: NotificationTopic): boolean {
  return ESSENTIAL_TOPICS.includes(topic) || preferences.notifications[topic] !== false;
}

export function restorePreferences(value: unknown): Preferences {
  if (typeof value !== "object" || value === null) return DEFAULT_PREFERENCES;
  const raw = value as Record<string, unknown>;
  const stored = typeof raw.notifications === "object" && raw.notifications !== null ? (raw.notifications as Record<string, unknown>) : {};
  const notifications = { ...DEFAULT_PREFERENCES.notifications };
  for (const topic of Object.keys(notifications) as NotificationTopic[]) {
    if (typeof stored[topic] === "boolean") notifications[topic] = stored[topic] as boolean;
  }
  for (const topic of ESSENTIAL_TOPICS) notifications[topic] = true;
  return { notifications, reduceMotion: raw.reduceMotion === true };
}
