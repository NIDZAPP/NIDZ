/** What « À propos de Nidz » states (Nidz 1.7 §23.6). The version is the
    product milestone this build implements, not a store release. */
export const APP_VERSION = "1.7";
export const APP_STAGE = "prototype";

/** The open-source pieces the interface is built on, with their licences —
    shown in Paramètres › Informations légales. */
export const LICENSES: readonly { name: string; licence: string }[] = [
  { name: "Readex Pro", licence: "SIL Open Font License 1.1" },
  { name: "dzcode-io/leblad", licence: "MIT" },
  { name: "React", licence: "MIT" },
  { name: "React Router", licence: "MIT" },
  { name: "Radix UI", licence: "MIT" },
  { name: "shadcn/ui", licence: "MIT" },
  { name: "Tailwind CSS", licence: "MIT" },
  { name: "Lucide", licence: "ISC" },
  { name: "i18next", licence: "MIT" },
  { name: "Vite", licence: "MIT" },
];
