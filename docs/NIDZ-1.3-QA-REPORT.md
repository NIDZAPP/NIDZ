# Nidz 1.3 — Rapport de QA final (LOT 11)

**Branche :** `nidz-1.3` · **Départ de l'audit :** `376f797` · **Date :** 23 novembre 2026
**Environnement :** Chromium (Playwright 1.63, sans tête) contre le serveur de développement Vite (`127.0.0.1:8080`), Node 22.

## Décision

- **GO pour considérer le front-end 1.3 stabilisé** : les cinq lots P0 et les tests essentiels passent, aucune régression P0 ouverte.
- **NO-GO pour une marketplace publique** : pas de backend, pas d'authentification réelle, pas de demandes entre deux vrais utilisateurs (voir `docs/NIDZ-1.3-BACKEND-HANDOFF.md`).

## Contrôles exécutés

| Contrôle | Résultat | Remarque |
|---|---|---|
| `npm run typecheck` (`tsc -b --force`) | PASS | 0 erreur |
| `npm run lint` | PASS | 0 erreur, **7 avertissements anciens** (react-refresh dans `src/components/ui/*`, présents avant l'audit), aucun nouveau |
| `npm run check:locales` | PASS | parité fr/en/ar, pluriels complets, clés utilisées résolues |
| `npm run build` | PASS | avertissement de taille de chunk **ancien mais réduit** : bundle principal 841 KB → 523 KB (gzip 261 → 174 KB) grâce au découpage par écran |
| `git diff --check` | PASS | |
| `npm run test:unit` | PASS 28/28 | `node:test` via Vite (aucune dépendance ajoutée) |
| `npm run test:e2e` | PASS 237/237 | 10 fichiers, un par lot + le parcours final, contre le serveur de dev |
| Build de production (`vite preview`) | PASS 104/104 | `lot11`, `lot01`, `lot04`, `lot09` rejoués contre le build (chunks différés, service worker) |

## Parcours réels dans le navigateur (`e2e/lot11-final-qa.mjs`, français, 390×844, navigateur vierge)

| # | Scénario | Statut |
|---|---|---|
| 1 | **Propriétaire :** accueil → « Trouver une garde » → chien **de grande taille** (Milo) → Alger → garde chez le pet-sitter + dates → résultats compatibles (Amina, Nadia ; ni Youcef ni Karim) → profil d'Amina (« Bien adapté à Milo ») → « Demander une garde » → compte (erreur de formulaire nommée, saisie conservée) → **« Votre demande à Amina B. »**, même animal, service et dates → envoi → écran « Demande de démonstration envoyée » → détail « En attente » → historique | **PASS** |
| 2 | **Pet-sitter :** « Espace pet-sitter » → nom, téléphone, Hydra → tableau de bord « Pour publier » / « Enrichir mon profil » → présentation, promenade 500 DA, chiens grands → 4 sur 4 → aperçu (même composant que le profil public) → publication locale → demande d'essai via « Outils de test » → demande reçue → **question locale** (reste « En attente ») → réponse côté propriétaire → acceptation → statut propriétaire « Acceptée », expliqué comme non-réservation ; la demande à Amina reste « En attente » | **PASS** |
| 3 | **Cas limites :** Youcef + grand chien (incompatibilité énoncée, pas de « Bien adapté ») ; recherche chat (aucune raison « chien ») ; aucun résultat (état vide + « Effacer tous les critères ») ; demande sans compte (passerelle portant la demande) ; aucun animal (« Ajouter mon animal », LOT 01) ; Retour, rechargement, modification d'animal, reprise d'un brouillon (LOT 01) ; formulaire invalidé (LOT 08) ; changement d'espace sans perte de brouillon (LOT 04) | **PASS** |
| 4 | **UI :** 320, 390×844, 768, 1280 ; FR/EN/AR, arabe RTL ; 13 écrans par combinaison sans défilement horizontal, cibles ≥ 44 px, contrôles nommés, un seul `h1` ; focus sur le titre après navigation ; premier Tab visible ; `prefers-reduced-motion` ; fond blanc, Inter, pas de Playfair | **PASS** |

## Statut par lot

| Lot | Statut | Tests |
|---|---|---|
| 01 — Ne jamais perdre le pet-sitter choisi (P0) | PASS | `lot01` 37 |
| 02 — Accueil mobile, démarrage immédiat (P0) | PASS | `lot02` 29 |
| 03 — Recherche, vrais filtres, bonnes cartes (P0) | PASS | `lot03` 34 + unitaires |
| 04 — Navigation propriétaire / sitter (P0) | PASS | `lot04` 28 |
| 05 — Onboarding sitter compréhensible (P0) | PASS | `lot05` 17 + unitaires |
| 06 — Profil humain, lisible (P1) | PASS | `lot06` 15 |
| 07 — Clarifier avant d'accepter (P1) | PASS | `lot07` 20 + unitaires |
| 08 — Animaux, compte, formulaires (P1) | PASS | `lot08` 18 |
| 09 — Fluidité, microcopy, mobile, a11y (P1) | PASS | `lot09` 16 |
| 10 — Nettoyage ciblé, préparation backend (P1) | PASS | unitaires 28 |
| 11 — QA finale | PASS | `lot11` 23 |

## NON TESTÉ (déclaré, pas supposé)

- **Lecteur d'écran réel** (VoiceOver, TalkBack, NVDA) : non disponible ici. Seule la structure a été vérifiée automatiquement (noms accessibles, `h1` unique, focus, `role="alert"`/`status`).
- **Zoom navigateur 200 %** : non testé en tant que tel ; la mise en page à 320 px (équivalent de reflux) passe.
- **Parcours entièrement au clavier** : seuls le premier Tab, le focus après navigation et les groupes radio ont été vérifiés.
- **Clavier virtuel mobile** et appareils réels (iOS/Android) : non testés ; tous les tests tournent dans Chromium émulé.
- **Contenus très longs** (noms ou textes extrêmes) : non testés spécifiquement.

## Défauts connus et dettes reportées

- Le champ date natif affiche le format du **navigateur** (p. ex. `mm/dd/yyyy`), pas celui de la langue de l'application.
- L'étape « À propos » du sitter ne conserve pas encore un brouillon non enregistré (LOT 08 a couvert les formulaires propriétaire).
- Aide et Politiques ne surlignent aucun onglet.
- Le bundle principal (523 KB) dépasse encore le seuil d'avertissement de Vite ; les traductions (trois langues) y sont chargées d'emblée.
- L'installation d'une dépendance de test (Vitest) a été refusée par les permissions de la session : les tests unitaires utilisent `node:test` sans dépendance.
- **Pour l'audit backend** : liste complète dans `docs/NIDZ-1.3-BACKEND-HANDOFF.md` (API, accès, données partagées, mécanismes de confiance, éléments de démonstration à retirer).

## Captures

Prises par `QA_SHOTS=<dossier> node e2e/lot11-final-qa.mjs` (non versionnées) : accueil, résultats grand chien, profil d'Amina, récapitulatif « Votre demande à Amina B. », demande envoyée, tableau de bord sitter, aperçu, question locale, statut propriétaire.

## Fichiers modifiés (depuis `376f797`)

82 fichiers, +5 329 / −1 236. Principaux : `src/data/` (`request-draft.ts`, `criteria.ts`, `offer.ts`, `repository.ts`, `clarification.ts`, `sitter-sections.ts`, `types.ts`), `src/state/demo/reducer.ts`, pages `owner/request/*`, `owner/*`, `sitter/*`, `Search.tsx`, `SitterProfile.tsx`, `Settings.tsx`, `onboarding/Welcome.tsx`, composants `layout/*`, `sitter/*`, `request/*`, `shared/*`, hooks `use-form-draft.ts`, `use-return-to-dashboard.ts`, les trois fichiers de langue, `e2e/`, `tests/unit/`, `scripts/unit-tests.mjs`, `DESIGN.md`, `CLAUDE.md`, `docs/NIDZ-1.3-BACKEND-HANDOFF.md`. Supprimés : `src/state/splash.ts`, `src/data/sitter-name.ts`.
