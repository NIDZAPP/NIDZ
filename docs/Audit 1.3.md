# NIDZ — AUDIT 1.3

**Version cible :** `nidz-1.3` (GitHub)  
**Date :** 22 novembre 2026  
**Destinataire :** Claude Code — **Opus 5.5**  
**Type :** plan de corrections **UX, UI et front-end**, exécutable lot par lot  
**État :** recommandations de correction ; aucune tâche n'est présumée implémentée.

## 0. Décision de périmètre (à respecter)

**Objectif de Nidz 1.3 :** stabiliser les parcours propriétaire et pet-sitter, améliorer fluidité, compréhension, matching et confiance, puis préparer le code à être connecté à un vrai backend.

**Le backend, Supabase, l'authentification réelle, les demandes synchronisées entre deux comptes et le déploiement public seront traités dans un AUDIT SUIVANT.** Ne pas les ajouter implicitement à cette version. Ne pas commencer une intégration Supabase, SMS, OAuth, paiement, hébergement ou domaine pendant les lots ci-dessous.

**Important — « prêt à lancer » :** Nidz 1.3 doit être *prêt côté interface et architecture front-end* à accueillir un backend, **pas déclaré prêt pour une marketplace publique**. La version 1.2 utilise encore un état local et des données de test ; un fonctionnement entre deux vrais utilisateurs n'existe pas encore. Un lancement réel de la marketplace est donc **NO-GO** jusqu'au futur audit backend/sécurité/lancement.

**Mentions « démo » :** objectif final du produit public = aucune mention de démo, aucun faux utilisateur, avis, message, vérification ou statut. **Pour cette version sans backend, ne jamais supprimer une indication de simulation si son retrait donne l'impression qu'une action réelle a été accomplie.** Supprimer seulement les rappels redondants, centraliser l'information et maintenir une indication claire à chaque moment sensible (connexion, envoi, publication, communication). Les fixtures restent isolées des futurs contenus réels. La suppression totale des mentions en production sera **bloquée jusqu'à l'activation des vraies fonctions**.

### Sources et niveau de preuve
- **Code inspecté :** archive `NIDZ-nidz-1.2.zip`, notamment `src/App.tsx`, `src/pages/onboarding/Welcome.tsx`, `src/pages/Search.tsx`, `src/pages/owner/request/RequestReview.tsx`, `src/components/layout/workspace-nav.ts`, `src/pages/sitter/SitterProfileHome.tsx`, `src/data/`, `src/state/demo/` ; `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`, `docs/Audit 1.2.md` et plan d'implémentation 1.2.
- **Constats de test rapportés par Work (transmis par l'équipe) :** perte du sitter choisi ; entrée sitter sous le premier écran à 390 px ; carte de chien mettant en avant « accepte les chats » et incohérence de taille pour Youcef ; 9 sections annoncées pour 3 nécessaires ; absence de question avant décision sitter. Ces résultats ne sont pas des tests ré-exécutés pour cet audit.
- **Références d'expérience :** principes de lisibilité et fluidité inspirés d'Apple ; Rover comme référence de comparaison, **sans copier son design** et sans promettre ses fonctionnalités que Nidz n'a pas.

## 1. Priorités en un coup d'œil

| Ordre / lot | Priorité | Section | Résultat obligatoire |
|---|---|---|---|
| **01** | **P0** | Demande propriétaire | Conserver le même sitter, animal, dates et service à travers tout le tunnel |
| **02** | **P0** | Accueil mobile / splash | Deux entrées visibles immédiatement, aucun clic invisible |
| **03** | **P0** | Recherche et matching | Aucune incompatibilité présentée comme « adaptée » ; cartes utiles |
| **04** | **P0** | Navigation et contextes | Un compte, deux espaces ; destinations cohérentes sans onglet mort |
| **05** | **P0** | Onboarding pet-sitter | Progression fidèle aux vraies obligations et publication |
| **06** | **P1** | Profils pet-sitter | Lecture rapide, chaleur humaine, limites et prix clairs |
| **07** | **P1** | Clarification avant acceptation | Pouvoir poser une question / préparer une rencontre sans fausse communication |
| **08** | **P1** | Animaux, compte et formulaires | Réduire la friction ; photo facultative après la recherche |
| **09** | **P1** | Design, fluidité, textes et accessibilité | Interface apaisée, responsive, RTL et états robustes |
| **10** | **P1** | Hygiène du code / préparation backend | Réduire la dette sans refonte, frontières de données documentées |
| **11** | **P0 QA** | Vérification finale 1.3 | Scénarios réels navigateur, non-régression, rapport de blocages |

**P0 = avant de continuer d'ajouter des fonctions. P1 = avant de considérer le front 1.3 stabilisé.**

---

## 2. Détail des corrections et critères d'acceptation

### LOT 01 — P0 — Ne jamais perdre le pet-sitter choisi

**Problème constaté :** après création de compte ou ajout d'animal, l'utilisateur peut être renvoyé ailleurs et perdre le contexte « Votre demande à Amina ».

**À corriger :**
- Conserver explicitement l'identifiant du sitter, l'animal sélectionné / brouillon d'animal, le service, la période, la zone de recherche et les critères de compatibilité.
- Après la création du compte, l'ajout / édition d'animal et les allers-retours, revenir au **récapitulatif de demande du même sitter**.
- Éviter les divergences entre paramètres URL et état local ; définir une source de vérité et un mécanisme de restauration sûr. Protéger les brouillons contre les redirections, le rafraîchissement et le bouton Retour.
- Ne jamais créer une demande pour un autre sitter ou écraser un animal existant par erreur. Aucune réservation réelle n'est introduite.

**Validation :** choisir Amina → dates et service → créer son compte → ajouter un animal → revenir à « Votre demande à Amina » avec les mêmes données. Répéter avec Retour, rechargement, modification d'animal et reprise d'un brouillon ; aucun transfert silencieux vers Youcef.

**Zones probables :** `src/pages/owner/request/RequestReview.tsx`, `src/pages/Auth.tsx`, `src/pages/owner/OwnerAccount.tsx`, `src/pages/owner/PetEdit.tsx`, `src/data/criteria.ts`, `src/state/demo/`.

### LOT 02 — P0 — Accueil mobile et démarrage immédiat

**Problème Work :** à 390 px, « Devenir pet-sitter » est sous le premier écran.

**À corriger :**
- Afficher tout de suite **« Trouver une garde »** et **« Devenir pet-sitter »** ; un message de valeur en une phrase, sans longue introduction au-dessus des actions.
- Rééquilibrer la présentation des deux usages : propriétaire = découverte, sitter = activité de garde ; distinguer par contenu, pas deux gros pavés de texte.
- Supprimer le splash à délai arbitraire ou le rendre non bloquant **sans rendre l'UI sous le masque cliquable**. En 1.2, `Welcome.tsx` utilise environ **850 ms** et un overlay `pointer-events-none` : examiner et corriger ce comportement.
- Maintenir un sélecteur de langue accessible.

**Validation :** à **390×844 CSS px**, les deux actions sont visibles sans défiler ; bon rendu à 320 px et en arabe RTL ; pas d'élément masqué qui reçoit un clic/focus ; arrivée rapide sans animation forcée.

**Zones probables :** `src/pages/onboarding/Welcome.tsx`, `src/pages/Index.tsx`, styles de mise en page, traductions.

### LOT 03 — P0 — Recherche, vrais filtres et bonnes cartes

**Problème Work :** une recherche de chien met « Accepte les chats » en avant ; Youcef n'accepte que les petits chiens.

**À corriger :**
- Les contraintes dures doivent tenir compte des **espèces**, **tailles**, **services**, et des **indisponibilités explicitement connues** ; une information absente n'est pas une preuve de compatibilité ou de disponibilité.
- Sur chaque carte, afficher d'abord les faits relatifs à **l'animal réellement recherché** : espèce et taille admises, commune/zone approximative, service, prix **avec unité** ; photo autorisée si disponible.
- Une raison « Bien adapté à Milo » doit provenir des vraies déclarations et du filtre courant, jamais d'une formule marketing ni d'un pourcentage artificiel.
- Garder **un seul CTA** : « Voir le profil ». Préserver l'état sans résultat et le bouton pour effacer les filtres.
- Ne pas transformer le prix croissant en substitut à la pertinence : préserver les exclusions certaines puis utiliser un ordre explicable ; ne pas annoncer « meilleure correspondance » sans algorithme fondé. Si un tri par prix reste disponible, le nommer comme **option choisie**, pas comme pertinence par défaut.
- Ne pas inventer de distance exacte : une commune connue n'est pas « à 1,2 km » sans données géographiques fiables.

**Validation :** chercher un **grand chien** → Youcef n'est pas déclaré compatible si seules les petites tailles sont admises ; chercher un chat → aucune raison « chien adapté » en premier ; aucun prix sans unité, aucun faux « disponible » ; FR/EN/AR cohérents.

**Zones probables :** `src/pages/Search.tsx`, `src/components/sitter/SitterCard.tsx`, `src/components/sitter/match.tsx`, `src/data/criteria.ts`, `src/data/demo-sitters.ts`.

### LOT 04 — P0 — Navigation propriétaire / sitter sans confusion

**À corriger :**
- Conserver **un compte pouvant utiliser deux espaces de travail** ; l'usage actif détermine le menu et les raccourcis.
- **Propriétaire :** Accueil/découvrir, Recherche si elle est utile séparément, Demandes, Mes animaux et Profil/compte via navigation primaire ou accès secondaire clair selon l'espace disponible. **Pet-sitter :** Demandes, Disponibilités, Profil de garde et Compte si les écrans sont réellement implémentés.
- Stabiliser l'emplacement des fonctions ; ne pas ajouter un onglet « Messages », « Calendrier » ou « Profil » qui conduit à `NotAvailable`. Un état vide **authentique pour une fonction existante** est acceptable, un onglet mort non.
- Un changement de contexte ne doit pas effacer les brouillons. En mobile, barre inférieure discrète et claire ; sur desktop, navigation cohérente.
- Si « Mes animaux » et Paramètres existent déjà, les rendre faciles à retrouver **avant de recréer un écran**.

**Validation :** depuis chaque espace, l'utilisateur atteint ses actions principales rapidement ; 0 onglet mort ; pas de duplication de compte ; bon comportement sur 390 px, desktop et RTL.

**Zones probables :** `src/components/layout/workspace-nav.ts`, `WorkspaceNav.tsx`, `Header.tsx`, `Layout.tsx`, `src/pages/Settings.tsx`, `src/App.tsx`.

### LOT 05 — P0 — Onboarding sitter réellement compréhensible

**Problème Work :** l'écran annonce **9 sections**, mais la publication est possible après **3** ; le code possède aussi des sections d'enrichissement optionnelles.

**À corriger :**
- Séparer visuellement **« Pour publier »** et **« Enrichir mon profil »** ; compter et valider seulement ce qui relève réellement de chaque groupe.
- Le minimum de publication doit comprendre au moins les informations indispensables pour juger l'offre et éviter de masquer les contraintes de garde (identité publique, localisation approximative, service, animaux/tailles, tarif/unité, limites critiques suivant le service). **Vérifier les validations présentes avant d'arrêter exactement le minimum** : le test Work indique 3 requis, mais ce n'est pas une décision métier confirmée.
- Conserver l'aperçu fidèle au rendu propriétaire ; sauvegarde et modification après publication. Ne pas appeler « profil vérifié » un profil complet.
- Les sections enrichies doivent réellement être accessibles, pas factices ; ne pas pénaliser les nouveaux sitters pour l'absence d'avis.

**Validation :** aucun compte trompeur (ex. 3/9 interprété comme obligation de tout remplir) ; impossible de publier un profil sans les champs essentiels définis ; aperçu identique au profil public ; retours et reprise corrects.

**Zones probables :** `src/pages/sitter/SitterProfileHome.tsx`, `SitterPreview.tsx`, `SitterPublished.tsx`, `SitterSections.tsx`, `SitterBuilder.tsx`, données de profil sitter.

### LOT 06 — P1 — Profil humain, lisible et comparable

**À corriger :**
- Au premier écran mobile, afficher une identité/photo **avec droit d'utilisation**, la zone approximative, les espèces/tailles acceptées, service et prix/unité, **1 à 2 raisons concrètes** de correspondance et un CTA principal « Demander une garde ».
- Conserver l'excellent contenu Nidz sur les limites, conditions du logement, surveillance, routines et urgences, mais l'organiser par sections lisibles plutôt qu'en long mur de texte ou badges.
- Ajouter des **photos autorisées réelles** si l'équipe les fournit ; sinon garder le monogramme. Jamais de photo stock présentée comme sitter réel. Photographies du domicile facultatives et sensibles : respect de la vie privée.
- Les avis dans le prototype sont des exemples : ils ne deviennent jamais des avis d'utilisateurs réels. Pas d'identité vérifiée sans contrôle opérationnel.
- Le même composant doit être réutilisé pour aperçu sitter et profil côté propriétaire afin d'éviter des écarts.

**Validation :** en quelques secondes, une personne comprend pour quel animal et quel service le sitter convient, à quel tarif, et ses limites ; détails consultables sans surcharge ; action primaire visible sans concurrents.

**Zones probables :** `src/components/sitter/SitterProfileView.tsx`, `SitterCard.tsx`, `ReviewSection.tsx`, `PortfolioSection.tsx`, `src/pages/SitterProfile.tsx`.

### LOT 07 — P1 — Clarifier avant d'accepter (sans inventer une messagerie)

**Problème Work :** seuls « Accepter » et « Refuser » apparaissent dans les demandes reçues.

**À corriger :**
- Proposer une **clarification avant décision** : « Poser une question » et, seulement si un parcours utile est défini, « Proposer une rencontre ».
- **En 1.3 sans backend**, créer un brouillon local testable ou un petit échange local dans le même navigateur, clairement identifié comme essai. Ne pas annoncer qu'un message a été envoyé sur le téléphone d'une autre personne. Il ne faut pas fabriquer de notification, SMS, rendez-vous confirmé ou discussion réelle.
- La demande reste **En attente** pendant la clarification ; seuls accepter/refuser changent le statut. L'animal, les dates et le sitter restent dans le contexte.
- Préparer une interface de données remplaçable pour le futur backend, sans le coder maintenant.
- Supprimer de l'interface du produit les consignes de test internes du type « envoyez-vous une demande à vous-même » ; conserver ces actions dans une zone d'outillage de test explicitement séparée, si indispensables.

**Validation :** question en cours ≠ acceptation ; conservation du contexte ; aucune formulation prétendant à une transmission réelle ; pas de faux écran « rendez-vous confirmé ».

**Zones probables :** `src/pages/sitter/SitterRequests.tsx`, `src/pages/owner/OwnerRequestDetail.tsx`, données/statuts de demande, futur contrat de communication.

### LOT 08 — P1 — Animaux, compte et friction des formulaires

**À corriger :**
- Ne pas imposer ni mettre en avant l'ajout de photo **avant de découvrir les sitters** : garder la photo facultative dans « Mes animaux » ou dans le profil détaillé.
- Ne demander les éléments de compte que lorsque nécessaires à l'action ; permettre la découverte sans authentification.
- Conserver le multi-animal (chien, chat, oiseau) tel qu'il existe en 1.2 ; champs conditionnels selon espèce ; jamais un formulaire chien sur un oiseau.
- Valider clairement les champs, préserver les valeurs après erreur, ne pas effacer un brouillon par navigation ou changement de langue.
- Garder le vocabulaire « Envoyer une demande », jamais « Réserver » ou « Payer » tant que ces fonctions n'existent pas.

**Validation :** un utilisateur peut consulter des profils sans créer de compte ; ajouter un animal depuis sa demande revient au bon sitter ; le formulaire mobile garde sa saisie ; la photo n'est pas un obstacle.

**Zones probables :** `src/pages/owner/need/NeedPet.tsx`, `src/components/owner/PetForm.tsx`, `src/pages/owner/PetEdit.tsx`, `OwnerAccount.tsx`.

### LOT 09 — P1 — Fluidité, microcopy, mobile, accessibilité

**À corriger :**
- Préserver les **décisions actives de l'Audit 1.2** : fond d'application **blanc `#FFFFFF`**, Inter, vert-bleu `#0F766E`, terracotta rare, Lucide, peu d'ombres ; **ne pas réintroduire le fond crème ou Playfair** de la version 1.1.
- « Esprit Apple » = clarté, retour logique, changements d'état prévisibles, animations discrètes ; pas de copie visuelle d'iOS ni de glassmorphism.
- Bouton Retour sur les écrans secondaires seulement ; retour au contexte précis, pas systématiquement à l'accueil. Restaurer focus/scroll correctement. CTA fixes sans chevauchement avec clavier et barre mobile.
- Masquer le footer marketing sur mobile s'il double la navigation basse ; garder les pages légales/support accessibles.
- Réduire les explications longues et répétitions de « démo » ; **ne jamais supprimer une précision nécessaire à l'honnêteté d'une action simulée**. Éviter les promesses de disponibilité, de sécurité, de contact ou de vérification non fondées.
- États : chargement, aucun résultat, aucune demande, attente, acceptation/refus, erreurs, mauvais réseau futur ; messages clairs, sans faux succès.
- Tester 320/390/768/desktop, clavier, focus, zoom, lecteurs d'écran sur parcours critique lorsque possible, AR/RTL, `prefers-reduced-motion`, cibles tactiles ~44 px.

**Validation :** aucun clic caché ; pas de CTA hors écran ; navigation accessible ; textes FR/EN/AR ; fluidité sans animations forcées ; aucun bandeau d'explications redondantes sur chaque écran.

### LOT 10 — P1 — Nettoyage ciblé et préparation à l'intégration backend

**À corriger :**
- Inspecter avant suppression. Si les deux systèmes de toast sont encore montés dans `App.tsx`, n'en garder qu'un après inventaire de leur utilisation ; éviter les régressions.
- Évaluer la suppression des styles `.dark` hérités **s'ils sont réellement inutilisés**, sans casser les tokens 1.2.
- `QueryClientProvider` n'est pas une dette à enlever automatiquement : le conserver s'il sert la future intégration, ou retirer seulement avec justification et tests. **Pas de purge aveugle des dépendances**.
- Faire converger les accès aux données de profils/demandes vers des fonctions ou services remplaçables ; séparer modèle métier, état local de test et présentation. **Sans installer Supabase et sans écrire de fausses API.**
- Garantir l'isolation des fixtures, du self-test, des fausses notes et des outils de dev ; documenter précisément ce qui devra être remplacé par des requêtes serveur et de vraies identités.
- Enrichir uniquement les tests qui protègent les régressions importantes : critères de matching, persistance du brouillon, validation de publication sitter et transitions de demande.

**Validation :** build/typecheck/locales inchangés ou améliorés ; pas de changement fonctionnel non autorisé ; une liste claire des dépendances front-end → backend pour l'audit suivant.

### LOT 11 — P0 QA — Revue de bout en bout et décision de fin d'audit

**Vérifier réellement dans un navigateur :**
1. **Propriétaire :** accueil → chien de grande taille → recherche → résultats compatibles → profil Amina → demande → compte/animal → récapitulatif du **même** sitter → demande d'essai → historique.
2. **Sitter :** entrée → compléter minimum requis → aperçu → publication locale → demande reçue → question locale → acceptation/refus → statut propriétaire local cohérent.
3. **Cas limites :** Youcef / taille de chien incompatible ; chat ; absence de résultat ; aucun animal ; retour, rechargement, invalidation d'un formulaire ; changement de contexte.
4. **UI :** 320, 390×844, 768 et desktop ; FR/EN/AR, arabe RTL ; focus, clavier, tailles de cibles, contenus longs, erreurs et réduction du mouvement.

**Commandes si disponibles dans le dépôt :** `npm run build`, `npm run typecheck`, `npm run lint`, `npm run check:locales`, `git diff --check`. Noter clairement les warnings anciens versus nouveaux. Si des tests automatisés sont ajoutés, fournir les résultats. Utiliser Playwright CLI si effectivement installé et fonctionnel ; sinon déclarer le test navigateur non effectué et ne pas prétendre qu'il a réussi.

**Livrable attendu :** rapport concis **PASS / NEEDS FIX / NOT TESTED**, liste des fichiers modifiés, captures ou chemins des captures si réalisés, tests exécutés et résultat, dettes reportées à l'audit backend.

---

## 3. Règles communes à TOUS les lots Claude Code

1. **Une tâche à la fois** : implémenter seulement le lot demandé, pas l'audit entier dans une seule session de modification.
2. Lire d'abord les fichiers concernés, `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`, le Design System Nidz, `docs/Audit 1.2.md` et cet audit. Respecter les **décisions actives 1.2** si un ancien document les contredit.
3. Branche de travail `nidz-1.3` (ou `feature/1.3-xx` créée depuis celle-ci), **jamais `main`** ; aucun force-push, fusion automatique, suppression de données, déploiement ou action payante.
4. Réutiliser React/Vite/TypeScript, Tailwind, shadcn, i18next et les composants existants ; **ne pas reconstruire tout Nidz**.
5. Aucune simulation présentée comme une vraie opération : auth, OTP, message, avis, vérification, disponibilité, paiement et confirmation. Pas de secrets dans Git.
6. Conserver FR/EN/AR, RTL, navigation clavier, accessibilité, limites pet-sitter et confidentialité des adresses précises.
7. Après chaque lot : inspecter le diff, exécuter les contrôles disponibles, tester les écrans affectés, consulter `ui-designer` (si interface) et `code-reviewer` si réellement disponibles, corriger les erreurs constatées, puis faire un commit ciblé si le dépôt est propre.
8. **Rapport court et vérifiable** : changements effectués, fichiers, résultats de tests, limites ; aucune réussite supposée.
9. Ne pas passer au lot suivant si un **P0** introduit une régression ou reste non vérifié.

## 4. Comment lancer le travail avec Opus 5.5

**Configuration conseillée :** Claude Code, **Opus 5.5**, effort **High ou Extra High** selon disponibilité et budget. Le nom du modèle ne remplace jamais la validation réelle des changements.

**Placer ce fichier dans** `docs/Audit 1.3.md` sur la branche `nidz-1.3`, puis fournir le prompt ci-dessous **pour un seul lot**. En tant que contexte, le fichier est la référence complète ; il n'est pas nécessaire de recoller l'intégralité du texte dans chaque prompt.

### Prompt initial à copier dans Claude Code (anglais)

```text
You are working on NIDZ, a React/Vite/TypeScript pet-sitting marketplace prototype for Algeria.

Read CLAUDE.md, PRODUCT.md, DESIGN.md, docs/Audit 1.2.md and docs/Audit 1.3.md, plus the Nidz design skill, before editing. Treat Audit 1.2's active design decisions as authoritative unless Audit 1.3 explicitly changes them.

Work on the nidz-1.3 branch (or a feature branch created from it). Do not touch main or rewrite history.

Implement ONLY LOT 01 (P0) from docs/Audit 1.3.md. First inspect the real code paths and briefly state your implementation plan. Then make the smallest correct changes, preserve the existing app architecture and FR/EN/AR RTL support, and avoid regressions. Do not introduce Supabase, a backend, OAuth, SMS, real payments, or external deployment.

Never make a simulated action appear real. Keep necessary test-mode disclosure until the real backend exists.

Run the available build, typecheck, lint, locales and diff checks; test the affected user journey in a real browser with Playwright if available. Use the project UI designer and code reviewer agents when available. Report changed files, checks actually run, pass/fail results and remaining issues briefly. Do not move to another lot.
```

**Pour les lots suivants :** remplacer seulement `LOT 01 (P0)` par `LOT 02 (P0)`, puis `LOT 03 (P0)`, etc., **après validation du lot précédent**. Les lots 06 à 10 sont P1 ; le lot 11 est la QA finale. Un nouvel audit des défauts relevés en QA peut générer des correctifs ciblés, pas une refonte générale.

---

## 5. Définition de terminé — version 1.3

- [ ] **P0 :** même sitter et même demande à travers compte, animal et retours ; accueil mobile sans friction ; matching correct ; navigation cohérente ; publication sitter cohérente.
- [ ] **P1 :** profils compréhensibles ; clarification locale non trompeuse ; formulaires simplifiés ; design/mobile/RTL/accessibilité vérifiés ; code nettoyé de façon ciblée.
- [ ] **QA :** scénarios propriétaire et sitter exécutés, résultats et défauts notés, aucune régression P0 ouverte.
- [ ] **Transmission backend :** liste d'API, de données, de règles d'accès et de mécanismes de confiance nécessaires pour l'audit suivant.

### À CONSERVER impérativement

- « Bien adapté à Milo » **uniquement quand les motifs sont vérifiables dans les données courantes**.
- Les **limites déclarées** du sitter, les conditions réelles de garde et les prix clairement libellés.
- Les provenances de confiance : **déclaré / vérifié / communauté / plateforme**.
- **Un seul compte, deux espaces ; FR/EN/AR et RTL ; DZD ; confidentialité de la localisation**.
- **Identité visuelle 1.2 : fond blanc et Inter**, Deep Teal et Terracotta sobres ; UI mobile fluide, sans faux badge ni faux avis.

### Décision de fin de version

**GO pour considérer le front-end 1.3 stabilisé** si tous les points P0 et les tests essentiels passent.  
**NO-GO pour une marketplace publique** tant que Supabase/backend/auth réels, demandes inter-utilisateurs, sécurité, confidentialité, modération/support et données de vrais profils ne sont pas implémentés et validés. Ces sujets appartiennent au **prochain audit — Backend & Lancement**, pas à ce document.

**Test terrain conseillé :** 5 propriétaires à Alger réalisent seuls « trouver un sitter compatible → commencer une demande → ajouter son animal → revenir au même sitter ». Mesurer réussites sur 5, abandons, incompréhensions et pertes de contexte. Ce test est qualitatif et ne représente pas toute l'Algérie.
