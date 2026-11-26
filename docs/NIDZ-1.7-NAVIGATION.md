# Nidz 1.7 — Navigation, fonctionnalités et expérience

**Branche :** `nidz-1.7` · **Départ :** `e43ee18` · **Date :** 25 novembre 2026
**Entrées :** le cahier « NIDZ — Complete Navigation, Functionality and User Experience Update » (§1–§27) et `Images.zip` (illustration d'accueil et 13 images d'animaux).

## 1. En une phrase

Un compte s'ouvre d'abord (Google, Apple ou téléphone, en prototype), puis on trouve une garde de deux façons — chercher et demander à un pet-sitter, ou publier sa demande pour recevoir des propositions — pour treize animaux décrits une seule fois, avec les mêmes quatre onglets dans les deux espaces.

## 2. Méthode

- **Conduite du design :** Impeccable (mode *Operate*, piloté par le code, dans le monde 1.4 : brume `#EDF2F0`, cartes blanches, teal `#0F766E` seule couleur d'action en pilules, terracotta `#A84F32` non interactive, Readex Pro) ; **interaction :** emil-design-eng (sortie en *ease-out*, 200 ms, pression à 0,97, mouvement réduit respecté, recul flou des cartes non choisies). `nidz-design` n'a pas été invoqué ; le système de design n'a été lu que pour ses règles produit.
- **Revues :** `code-reviewer` (relecture du diff, 16 constats) et `nidz-color-guardian` (contraste mesuré, rôles de marque, 4 constats). Tous traités — §10.
- **Contrôles :** vérification de types, lint, parité des langues, tests unitaires, 16 lots Playwright, balayage de mise en page 320→1440 px × fr/en/ar, build, captures réelles à 390 et 1366 px en français et en arabe.
- Un agent chargé de mettre à jour les anciens lots s'est arrêté sur une limite d'usage après une seule modification (`e2e/lib.mjs`, graine v4) ; elle a été relue avant usage. Les lots ont ensuite été mis à jour ici.

## 3. Parcours (§2–§13)

### Entrée et compte

| Adresse | Rôle |
|---|---|
| `/welcome` | Sans session : marque, langue, l'illustration fournie, la promesse, **Ouvrir un compte** / **Se connecter**. Un écran à 320×568 dans les trois langues. Avec une session : l'accueil du dernier espace. |
| `/register` | Choix de la méthode ; reprise d'une inscription interrompue ; un seul compte par appareil (« Un compte existe déjà… » → se connecter, ou tout effacer, confirmé). |
| `/register/:step` | Google / Apple : nom (prérempli si le fournisseur le donnait — ici, saisi, et l'écran dit que Google n'a pas été contacté) → téléphone → code → photo. Téléphone : téléphone → code → nom → photo. Le code accepte six chiffres et dit qu'aucun SMS n'a été envoyé. Le numéro est enregistré **non vérifié**. |
| `/login` | Se connecter au compte de cet appareil. |
| `/start` | Premier choix : **Trouver une garde** / **Devenir pet-sitter**, rien d'autre. Pas un rôle. |

Les étapes de l'inscription sont de vraies entrées d'historique (Retour les parcourt, les réponses sont un brouillon). Une fois le compte créé, aucune étape terminée ne reste derrière la destination : la piste du parcours (`register-history.ts`) revient à l'entrée `/register`, qui renvoie vers la destination — ou, si la chaîne n'est pas sûre, remplace simplement la dernière étape.

### Le parcours de l'animal

| Étape | Adresse | Contenu |
|---|---|---|
| Animal | `/owner/need/pet` | « Pour quel animal cherchez-vous une garde ? » — grille de 13 + Autre, trois par ligne, un choix, les autres reculent (image floutée, libellé net), un second appui désélectionne. « Autre » demande un nom (2–40 caractères). |
| Race / espèce | `/owner/need/breed` | Liste adaptée à la catégorie, recherche (trois langues, alias, accents ignorés), Autre / Je ne sais pas. Facultative ; **sautée** pour la souris et le furet. |
| Nom, âge, photo | `/owner/need/about` | Âge en années et mois, « environ », ou inconnu ; photo facultative (aperçu, remplacer, retirer ; redimensionnée en JPEG ≤ 640 px), distincte de l'illustration. |
| Besoins | `/owner/need/needs` | « Besoins et contraintes importantes », ⓘ, exemples en texte d'aide ; **Continuer** ou **Rien à signaler** (« sauté » ≠ « rien »). L'animal est enregistré ici. |
| Où | `/owner/need/location` | Manuel (wilaya requise, commune facultative, aucune permission) ou « À proximité de moi » (permission demandée au seul appui ; accordée / refusée / indisponible / délai / non pris en charge / hors d'Algérie ; repli manuel ; la wilaya trouvée est proposée à confirmer ; aucune coordonnée enregistrée). |
| Garde et dates | `/owner/need/care` | Les trois gardes et leurs explications, filtrées par l'animal (poisson : à domicile seulement) ; dates validées ; **Voir les pet-sitters** / **Publier ma demande**. Pas d'engrenage, pas de bloc « Nidz ne réserve rien ». |
| Publier | `/owner/need/publish` | « Publier votre demande de garde » : ce que voient les pet-sitters, ce qui reste privé, qu'elle ne réserve ni ne confirme rien ; doublon refusé. |

Un animal déjà enregistré entre dans le parcours depuis sa carte de « Mes animaux » (`?pet=`), à l'étape « où » — ou d'abord « besoins », s'ils n'ont jamais été renseignés.

## 4. Catalogue des animaux (§5)

`src/data/animal-catalogue.ts` : `id`, classification (`breed`, `species` ou aucune), services possibles, groupe. `animal-kinds.ts` : 138 races ou espèces (chien 31, chat 18, oiseau 13, perroquet 11, lapin 9, cochon d'Inde 10, hamster 5, poisson 14, tortue 6, serpent 7, caméléon 4), noms en fr/en/ar et alias. Le module refuse de se charger si le catalogue et la liste des espèces divergent.

- **Oiseau / Perroquet :** « Oiseau » = petits oiseaux de cage et de volière ; les perroquets sont une catégorie à part (longévité, manipulation quotidienne). Le gris du Gabon et la conure, rangés sous « oiseau » avant 1.7, deviennent des perroquets **avec le même identifiant** (`MOVED_KINDS`).
- **Images :** les 13 images fournies, converties en WebP 192 et 384 px (`srcset`), l'illustration d'accueil en 480/800/1024 px — 256 Ko au total, chargées en différé sauf les premières.
- **Taille du chien (§9) :** retirée du parcours propriétaire et de la recherche. Les tailles enregistrées ne sont pas effacées : la fiche de l'animal l'affiche comme ancienne information, avec « Retirer ». Une restriction de taille d'un pet-sitter devient l'une de ses **limites déclarées**, jamais supprimée en silence.

## 5. Compatibilité (§18–§19)

`src/data/compatibility.ts`, seul lecteur des races : `confirmed`, `unknown` (« à confirmer » : catégorie Autre, race non donnée, race en texte libre) ou `incompatible` (catégorie non acceptée, race exclue). Un pet-sitter déclare par catégorie « Toutes les races » (présélectionné) ou « Certaines … uniquement » (liste multiple + Autre). Le texte libre n'est **jamais** rapproché automatiquement. Une race ne dit rien du comportement ; les écrans le disent.

## 6. Proximité (§11)

Ordre : la commune, puis la wilaya, puis les autres wilayas par distance approximative entre chefs-lieux (`algeria/positions.ts`, 69 positions, consignées dans `KNOWN_GAPS`). C'est un **ordre**, jamais affiché comme une distance ; les plus lointains forment un groupe « Plus loin » qui le dit. Sans zone ni compte : ordre alphabétique, dit comme tel. Le prix n'ordonne que sur demande, à l'intérieur de chaque groupe.

## 7. Demandes publiées et propositions (§13–§14)

| | Demande directe (`CareRequest`) | Demande publiée (`CarePost`) | Proposition (`Proposal`) |
|---|---|---|---|
| Qui la crée | le propriétaire, pour un pet-sitter | le propriétaire, pour tous | un pet-sitter, sur une demande publiée |
| États | en attente, acceptée, refusée, retirée, annulée | publiée, acceptée, retirée, annulée | en attente, acceptée, refusée, non retenue, retirée, annulée, **dépassée** |

- **Une seule acceptation** par demande publiée, en une écriture : les autres propositions deviennent « non retenues ».
- Un refus est **définitif** pour cette demande ; un retrait permet de reproposer.
- Changer le service ou les dates d'une demande publiée rend les propositions en attente **dépassées** (le pet-sitter est prévenu et peut reproposer) : on n'accepte pas une réponse à une autre demande.
- Une demande publiée ne porte ni téléphone, ni nom de famille, ni adresse, ni plan de soins — le prénom et l'initiale, la zone, l'animal partagé et ses besoins.
- Ni une demande passée ni une proposition sur une demande passée ou close ne peuvent être tranchées ; elles ne comptent ni dans les badges, ni dans les onglets, ni dans les notifications.
- Six demandes d'exemple alimentent le fil du pet-sitter, marquées comme exemples ; deux pet-sitters d'exemple ont été ajoutés (petits mammifères ; perroquets, poissons et reptiles). « Simuler une proposition » est un outil de test séparé et étiqueté.

## 8. Navigation (§15–§23)

| Espace | Onglets | Écrans rattachés |
|---|---|---|
| Propriétaire | **Accueil** · **Demandes** · **Messages** · **Compte** | Accueil : `/search`, `/sitters/:id` · Demandes : `/owner/requests/:id`, `/owner/posts/:id` · Compte : `/settings/*`, `/account/*`, `/help`, `/policies`, `/sitter/profile` |
| Pet-sitter | **Accueil** · **Demandes** · **Messages** · **Compte** | Accueil : `/sitter/posts/:id` · Demandes : `/sitter/requests/:id` · Compte : idem |

- **Accueil propriétaire :** Mes animaux (cartes avec « Trouver un pet-sitter » et « Publier une demande », état vide, suppression confirmée) / Explorer les pet-sitters (filtres simples, proximité). La vue est dans l'adresse.
- **Accueil pet-sitter :** le fil des demandes publiées, par proximité, avec la compatibilité de chacune ; un profil incomplet propose « Compléter mon profil ».
- **Le logo** mène là où mène l'onglet Accueil (son nom le dit). En 1.6 il menait au début de l'espace (`workspaceHome`) : pour un profil brouillon, au profil — et sur ordinateur, où l'onglet Accueil laisse place au logo, le fil n'avait plus d'entrée.
- **Demandes :** Reçues / Envoyées / Validées dans les deux espaces, « Brouillon » au-dessus seulement s'il en existe (reprendre ; abandonner, confirmé, sans toucher un animal enregistré), historique replié dans chaque section.
- **Messages :** Conversations / Notifications (filtrées par les préférences ; lien vers elles) ; la vue est dans l'adresse.
- **Compte :** photo, nom, informations personnelles, Mes animaux, les deux espaces (aucun → introduction, brouillon → reprise, publié → bascule), « Mon profil pet-sitter » (toutes les rubriques, aperçu, profil public si visible, indisponibilités), aide et sécurité ; l'engrenage en haut à droite (à gauche en arabe). Aucun engrenage dans les parcours.
- **Paramètres** (`/settings/:section`) : Sécurité et confidentialité (visibilité du profil, pet-sitters bloqués, export des données), Notifications (essentielles verrouillées, facultatives réelles), Préférences (langue, réduire les animations ; pas d'apparence sombre, non prise en charge, et c'est dit), Localisation, Aide et assistance (message copié, rien n'est envoyé), Informations légales / À propos, Gestion du compte (déconnexion, suppression confirmée et dite « sur cet appareil seulement », outils de test à part). Aucun réglage financier exposé.
- **Session :** se déconnecter garde toutes les données et **verrouille** les écrans du compte : `SessionGate` envoie toute adresse non publique vers « Se connecter », qui y revient.

## 9. Stockage et migrations

État **v4** (`nidz.demo`), lisible depuis v2 et v3. Ajouts : `signedIn`, `posts`, `proposals`, `preferences`, `blockedSitters`, `sitter.hidden`, `account.signInMethod` / `photoUrl`, `pet.ageInfo` / `otherCategory` / `needsStatus`, `sitter.acceptedKinds`.

| Avant 1.7 | En 1.7 |
|---|---|
| un compte enregistré | reste connecté (`signedIn: true`) ; une déconnexion enregistrée est respectée |
| `acceptedDogSizes` d'un pet-sitter | une limite déclarée qui le dit, si toutes les tailles n'étaient pas acceptées |
| gris du Gabon / conure en « oiseau » | perroquet, même identifiant ; les mots du propriétaire sur la cage passent dans la ligne « habitat » (le choix cage / volière n'est pas transformé en texte, qui resterait dans une langue) |
| `dogSize` d'un brief ou d'une URL (`size=`) | ignoré |
| une photo `blob:` | seules les photos `data:` (JPEG/PNG/WebP, < 400 000 caractères) sont conservées |

Le stockage reste traité comme une entrée non fiable : chaque publication, proposition et date est validée à la lecture ; une entrée corrompue coûte cette entrée, pas la liste.

## 10. Revues

**Code (16 constats, tous traités) :** l'écran de photo enregistrait la photo « passée » ; la déconnexion ne verrouillait pas Messages, une demande, Compte ni l'envoi, et modifier le compte reconnectait l'appareil ; les décisions de 1.7 ignoraient un refus d'écriture ; un refus n'était pas définitif ; modifier une demande publiée gardait des propositions acceptables pour l'ancienne ; le pet-sitter ne pouvait pas annuler un arrangement accepté ; les éléments passés restaient décidables et comptés ; une photo retirée dans un onglet revenait d'un autre ; `ProposalCard` était recréé à chaque rendu (perte du focus) ; identifiants dupliqués dans le formulaire du pet-sitter ; un titre dans un bouton ; préférences renvoyées en entier depuis l'état affiché ; effacement par `dispatch` ; titre d'onglet non interpolé ; validations de stockage manquantes ; contrôle de doublon seulement à l'écran ; ponctuation française codée en dur ; texte français écrit par la migration. Chacun est couvert par un test (`tests/unit/review-17.test.ts`, lot16).

**Couleur (4 constats, traités) :** libellés des cartes en recul à 3,87:1 → seule l'image recule, libellé en encre atténuée (6,3:1) ; anneau de focus filtré sur ces cartes → le bouton n'est plus filtré ; anneau de sélection caché sous l'image → dessiné en surimpression ; pilule blanche sur carte blanche → contour. `DESIGN.md` est mis à jour (fond des images, contraste de l'anneau 3,1–3,9:1, statuts, recul).

**Trouvés en plus pendant les contrôles :** l'écran d'accueil et le premier choix débordaient à 320×568 (hauteur en pourcentage non résolue dans une colonne `min-h-dvh`) ; « Ne plus voir ce pet-sitter » n'existait que sur ordinateur ; « Mon profil pet-sitter » n'avait pas de Retour ; une race « à confirmer » était titrée « Ne correspond pas » ; `/owner/account` permettait encore d'ouvrir un compte sans passer par l'inscription ; le logo et l'onglet Accueil menaient à deux endroits différents. Le balayage de mise en page a trouvé le dernier : sur ordinateur (colonne de 13rem), la rangée des animaux acceptés écrasait le nom d'un pet-sitter qui en accepte beaucoup jusqu'à une lettre par ligne — elle passe désormais sous le nom.

## 11. Défauts de navigation 1.5 (NAV-01…05)

Tous restent corrigés et gardés par `lot15` (mis à jour) : un brouillon pet-sitter reprend au profil, jamais au début de l'inscription (NAV-01, désormais via Compte et via « Compléter mon profil » du fil) ; « publié » seulement s'il est visible (NAV-02) ; la vue de Messages est dans l'adresse (NAV-03) ; une seule adresse par confirmation (NAV-04) ; pas de faux conflit sur un lien d'inscription direct (NAV-05).

## 12. Ce qui est simulé, et le dit

L'authentification Google / Apple, le SMS et sa vérification ; l'envoi d'une demande, d'une proposition, d'un message ou d'une notification (tout reste dans ce navigateur) ; la suppression du compte (sur cet appareil seulement) ; les pet-sitters et demandes d'exemple. Aucune vérification, réservation, disponibilité, assurance, paiement ni avis n'est présenté comme réel.

## 13. Propositions documentées (non implémentées)

1. **Statut légal de certaines espèces.** Certains oiseaux et reptiles sont protégés en Algérie ; Nidz ne devrait pas proposer leur garde sans règle. À trancher avec une source juridique — aucune liste n'a été inventée. Le pet-sitter d'exemple mentionne déjà « aucun animal dont la détention n'est pas légale ».
2. **Authentification réelle :** OAuth Google / Apple et un fournisseur de SMS, côté serveur ; le parcours et ses états sont prêts à les recevoir.
3. **Distances réelles :** des positions par commune (source ouverte à vérifier) permettraient un ordre plus fin ; il resterait un ordre, pas une promesse de trajet.
4. **Reconfirmation d'une proposition dépassée** en un geste, plutôt qu'une nouvelle proposition.
5. **Réglages financiers** (paiements, reçus, versements) : volontairement **absents** — une page « Moyens de paiement » vide laisserait croire qu'un paiement existe. Les sections de Paramètres sont une liste (`src/pages/settings-sections.ts`) : en ajouter une le jour où un paiement sera réel ne demande rien d'autre.

## 14. Résultats

Environnement : Chromium (Playwright, sans tête), serveur de dev Vite `127.0.0.1:8080`, Node 22.

| Contrôle | 1.6 (référence) | 1.7 |
|---|---|---|
| `npm run typecheck` | 0 erreur | 0 erreur |
| `npm run lint` | 0 erreur, 8 avertissements | 0 erreur, 7 avertissements (tous dans `src/components/ui/*`, fast refresh) |
| `npm run check:locales` | OK | OK (fr/en/ar, pluriels complets) |
| `npm run test:unit` | 98/98 | **139/139** (dont `publications.test.ts` et `review-17.test.ts`) |
| `npm run test:e2e` | 406/406 sur 14 fichiers | **523/523 sur 15 fichiers** (nouveau `lot16-nidz-17.mjs` : 78) |
| `node e2e/audit-layout.mjs` (tous les écrans × fr/en/ar × 320→1440 px) | 1 113 rendus, 0 problème | **1 617 rendus** (85 écrans, dont 30 nouveaux), 6 débordements trouvés — tous un même défaut de la carte de pet-sitter, corrigé, puis écrans concernés rebalayés : **0 problème** ; 42 troncatures volontaires (aperçus sur 2 lignes) ; 7 redirections attendues, désormais signalées |
| Détecteur Impeccable (57 fichiers d'interface modifiés) | — | 0 constat bloquant ; 8 avis « taille hors de l'échelle typographique » (chiffres de badges à 11 px, deux libellés à 13 px) |
| Build de production | OK, chunk principal 241,0 kB gzip | OK, **268,3 kB gzip** (+27 kB : surtout le texte des trois langues, ≈ +29 kB gzip à elles trois ; puis le catalogue des races et les exemples). Les vignettes 192 px sont intégrées au chunk des illustrations ; les 384 px et l'illustration d'accueil sont des fichiers à part |

Les lots 01 à 15 ont été mis à jour : ils vérifiaient des comportements retirés volontairement (formulaire de compte local, tailles de chien, engrenage des étapes, recherche en tête de l'Accueil, barre pet-sitter « Mon profil »). Leur intention est conservée ; chaque contrôle retiré porte « Retired in Nidz 1.7 » et sa raison. `lot11` (parcours complet en français) a été réécrit à travers l'inscription, le parcours de l'animal et le fil.

**Mouvement réduit :** vérifié par le réglage du système (`prefers-reduced-motion`) et par la préférence « Réduire les animations » : aucune transition ni aucun agrandissement ; sans eux, les transitions de 200 ms jouent.

**Captures examinées :** 390 px en français et en arabe (accueil, inscription, premier choix, grille et recul, race, nom et âge, besoins, lieu, garde, publication, Accueil propriétaire, Explorer, Demandes, détail d'une demande publiée, fil, détail, proposition, Messages, Compte, Paramètres) ; 320×568 (accueil en fr/en/ar) ; 1 366 px en français (accueil, premier choix, Mes animaux, Explorer, Demandes, Compte, Paramètres, Notifications, fil, détail, Messages).

**Proposition liée aux mesures :** charger à la demande les deux langues inactives retirerait du chunk principal environ 55 kB gzip (chaque fichier de langue pèse 27 à 32 kB gzip) ; non fait ici (changement de l'initialisation i18n, hors du périmètre).

**Non vérifié :** appareils physiques, Safari et Firefox, lecteurs d'écran réels, installation PWA, géolocalisation sur un vrai téléphone (simulée dans Chromium : accordée, refusée).
