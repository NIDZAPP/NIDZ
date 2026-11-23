# Nidz 1.3.1 — Correctifs A-01, A-02, A-19 et wilaya/commune

**Branche :** `nidz-1.3.1` · **Départ :** `cbc4a93` · **Date :** 23 novembre 2026
**Environnement :** Chromium (Playwright, sans tête), serveur de dev Vite `127.0.0.1:8080` et build de production `vite preview`, Node 22.

## Correctifs

| # | Problème | Correctif | Fichiers clés |
|---|---|---|---|
| A-01 | Brouillons perdus | Les formulaires non terminés sont des brouillons dans `localStorage` (`nidz.draft.<formulaire>`) : ils survivent au rechargement, à la fermeture/réouverture de l'app et à la navigation. Ils couvrent tous les formulaires propriétaire et pet-sitter, sont validés à la relecture, ne contiennent jamais d'URL `blob:`, et sont effacés à l'enregistrement, par « Effacer ce brouillon » ou par la réinitialisation. Un brouillon retrouvé est annoncé comme non enregistré. Les brouillons devenus inutiles (animal supprimé, demande tranchée, dates de demande de plus de 30 jours) sont purgés au démarrage. | `hooks/use-form-draft.ts`, `hooks/draft-validators.ts`, `components/shared/SaveFeedback.tsx` (`DraftNotice`) |
| A-02 | Échecs d'enregistrement silencieux | `commit` écrit d'abord, relit l'enregistrement, et n'affiche le nouvel état que si la relecture est identique. Un refus (quota, stockage bloqué, relecture différente) ne change rien, remet l'ancien enregistrement en place et renvoie `storage`. L'écran reste alors en place avec la saisie, un message clair et « Réessayer ». Aucun écran de succès (publication, demande envoyée, compte créé, effacement) sans données sur disque. | `state/demo/store.ts`, `state/demo/reducer.ts` (`writeState`), `hooks/use-save.ts` |
| A-19 | Écrasement entre onglets | Chaque écriture est rebasée sur l'enregistrement le plus récent : deux onglets qui ajoutent des choses différentes gardent les deux. Les écritures des autres onglets sont reprises en direct (événement `storage`). Un formulaire qui modifie un enregistrement changé ailleurs depuis son ouverture reçoit un `conflict`, et la personne choisit « Enregistrer ma version » ou « Reprendre la version enregistrée ». Une demande déjà tranchée ne peut pas l'être à nouveau, un enregistrement effacé ailleurs n'est jamais « enregistré », et l'espace affiché (propriétaire/pet-sitter) reste propre à chaque onglet. | `state/demo/store.ts`, `state/demo/DemoProvider.tsx`, `state/demo/profile-commit.ts` |
| Lieu | Wilayas sans communes et commune obligatoire | Le jeu de données couvre les **1 541 communes des 69 wilayas**. Le rattachement suit le Journal officiel (lois 19-12 et 26-06, texte des JO n° 78/2019 et n° 25/2026) pour les 38 wilayas redécoupées ; ailleurs, il reprend le découpage de 1984 de dzcode-io/leblad (MIT, licence jointe). Les effectifs correspondent à chaque article de loi et le total à 1 541. Les 371 identifiants existants sont inchangés. La commune est facultative pour toutes les wilayas, la wilaya est obligatoire, et la même règle `checkLocation` s'applique à tous les formulaires de lieu. Le profil gagne un `wilayaCode`, et un pet-sitter sans commune s'affiche sous « Aflou (wilaya) ». | `data/algeria/*`, `pages/sitter/SitterJoin.tsx`, `pages/owner/need/NeedLocation.tsx`, `data/criteria.ts` |

## Résultats

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | PASS, 0 erreur |
| `npm run lint` | PASS, 0 erreur, les 7 avertissements anciens de `src/components/ui/*` |
| `npm run check:locales` | PASS (parité fr/en/ar) |
| `npm run test:unit` | PASS 63/63 (31 avant), dont `persistence.test.ts` et `geography.test.ts` |
| `npm run test:e2e` | PASS 306/306 sur 11 fichiers (247 avant). Nouveau lot `lot12-storage-location.mjs` (59) : 390×844, FR, EN, AR en RTL, 1280 px |
| Build de production | PASS. `lot12`, `lot11` et `lot09` rejoués contre `vite preview` : 98/98 |
| Revue | agents `code-reviewer` et `ui-designer` : aucun point critique, avertissements traités |

## Limites connues

- Le bundle principal passe de 175 à 208 KB gzip, à cause des 1 170 communes ajoutées.
- Les noms des communes hors lois 19-12 et 26-06, ainsi que les noms arabes, sont la translittération de leblad et n'ont pas été vérifiés ligne à ligne au JO (voir `KNOWN_GAPS`). Les codes officiels des 11 wilayas de 2026 restent `null`.
- `localStorage` n'offre pas de transaction entre onglets : deux enregistrements lancés au même instant dans deux onglets peuvent encore se croiser au niveau du navigateur. Des enregistrements successifs ne le peuvent pas.
