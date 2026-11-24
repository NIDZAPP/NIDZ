# Nidz 1.6 — Refonte de la navigation et de l'architecture de l'information

**Branche :** `nidz-1.6` · **Départ :** `17d4fa8` (commit audité par la NIDZ 1.5) · **Date :** 24 novembre 2026
**Entrées :** audit de navigation NIDZ 1.5 (rapport, jeu de données JSON de 596 transitions, 216 captures, journaux) ; analyse du code par Archify ; lecture directe du routeur et des écrans.

## 1. En une phrase

Une même intention mène désormais au même endroit, quelle que soit la porte : quatre onglets par espace, la recherche dans l'Accueil, la personne et ses animaux dans Compte, les réglages derrière l'engrenage, et toutes les décisions « où cela mène-t-il ? » rassemblées dans un seul module testé (`src/data/navigation.ts`).

## 2. Méthode

1. **Audit 1.5.** Les cinq défauts confirmés (NAV-01 à NAV-05), les 81 états et les 10 adresses historiques servent de base. Chaque défaut a été relu dans le code, puis corrigé et couvert par un test.
2. **Archify (analyse interne).** `archify.si` est bloqué par la politique réseau de l'environnement. Le paquet a été installé depuis sa source GitHub (`tt-a1i/archify`, v3.3), pour Claude Code uniquement, hors du dépôt. `doctor` passe. Le mode *Code Analysis* (203 fichiers, adaptateur TypeScript) a confirmé ce que montrait l'audit : les décisions de navigation sont dispersées dans les écrans les plus complexes (`RequestReview` 60, `MessageThread` 53, `SitterProfile` 55, `Index` 32 en complexité cyclomatique), et aucun point unique ne répond à « où commence cet espace ? ». **Archify n'est pas une dépendance de l'application** : aucun fichier du dépôt ne le référence.
3. **Références.** Airbnb (Explorer contient la recherche et les annonces ; « Passer en mode hôte » ; profil avec réglages séparés), Rover et Pawshake (profil du pet-sitter construit par rubriques, boîte de réception unique), Wag et Uber (une action principale par écran d'accueil, badges de tâches en attente). Les principes repris sont adaptés à Nidz, sans copie d'éléments visuels : un onglet ne change jamais de nom selon la largeur, un écran secondaire garde son onglet parent allumé, un compteur ne compte que des choses qui attendent la personne.

## 3. Architecture cible (implémentée)

### Barres d'onglets

| Espace | Onglets | Écrans rattachés (l'onglet reste allumé) |
|---|---|---|
| Propriétaire | **Accueil** · **Demandes** · **Messages** · **Compte** | Accueil : `/search`, `/sitters/:id` · Demandes : `/owner/requests/:id` · Compte : `/settings`, `/owner/pets`, `/help`, `/policies` |
| Pet-sitter | **Demandes** · **Mon profil** · **Messages** · **Compte** | Compte : idem |

- Les deux onglets partagés (Messages, Compte) occupent la même place des deux côtés : la barre garde sa forme quand l'espace change.
- **Ordinateur** : même liste dans l'en-tête (le logo remplace « Accueil »). L'icône Messages de l'en-tête disparaît : un seul chemin vers Messages.
- **Compteurs** (badges), tirés uniquement des données de la personne, annoncés en mots : Demandes propriétaire = questions d'un pet-sitter qui attendent une réponse ; Demandes pet-sitter = demandes à trancher (hors celles qui attendent le propriétaire) ; Messages = conversations non ouvertes depuis le dernier message de l'autre côté.
- **Barre pet-sitter dès le brouillon.** En 1.5, la barre n'apparaissait qu'après publication : la personne qui finit son profil n'avait aucune navigation et un retour vers l'accueil propriétaire. Chaque onglet pet-sitter rend désormais un écran réel pour un brouillon. Commencer un profil ne change toujours pas l'espace actif (règle du réducteur).

### Où commence chaque espace — une seule règle (`workspaceHome`)

| État du profil pet-sitter (`sitterVisibility`) | Destination |
|---|---|
| aucun | `/sitter/start` |
| brouillon | prochaine étape (`sitterResumePath`) : nom → téléphone → zone → **Mon profil** |
| publié et visible | `/sitter/requests` |
| publié puis masqué (un essentiel retiré) | **Mon profil**, qui nomme ce qui manque |

Cette règle sert au logo, à `/`, à la bascule de Compte, à la seconde porte de l'Accueil, à l'état vide de la boîte et au bouton de l'introduction. Un propriétaire qui a déjà un compte n'est plus redirigé vers son nom et son numéro en devenant pet-sitter : il passe directement à la zone.

### Compte et Paramètres

- **Compte** (`/account`, nouveau) : la personne (ou « Vous naviguez sans compte », état normal avec ce qu'un compte permet), **Mes animaux** (côté propriétaire), **Vos deux espaces** (bascule), **Mon profil public** (côté pet-sitter, seulement s'il est visible), **Aide et sécurité**. Engrenage en haut à droite (à gauche en arabe).
- **Paramètres** (`/settings`) : Langue ; **Sécurité et confidentialité** (connexion — il n'y en a pas, le compte vit dans ce navigateur —, vos informations, tout effacer) ; outils de test séparés. Écran secondaire : retour vers Compte, ou vers l'étape d'où l'engrenage a été ouvert.
- L'engrenage des écrans de parcours ouvre Paramètres (il ouvrait l'ancien « Compte » avec une icône de curseurs).

### Recherche dans l'Accueil

L'Accueil commence par la recherche (« Trouver une garde » ou « Reprendre ma recherche »), puis **« Voir tous les pet-sitters »** : la découverte publique ne demande ni compte, ni animal, ni brief. Les lignes « Mes animaux » et « Mes demandes » quittent l'Accueil (Compte et onglet Demandes). Les résultats ont un retour vers l'Accueil.

## 4. Défauts de l'audit 1.5 corrigés

| # | Défaut | Correction | Test |
|---|---|---|---|
| NAV-01 | Un brouillon pet-sitter repartait au début de l'inscription ou dans une boîte vide | `workspaceHome` / `sitterResumePath`, utilisés par toutes les entrées ; l'introduction propose « Continuer mon profil » | unitaire `navigation.test.ts` ; e2e `lot15` §2 |
| NAV-02 | La confirmation annonçait « publié » pour un profil invisible | `SitterPublished`, la boîte, Mon profil et Compte lisent `sitterVisibility` (la règle de la recherche) ; état « n'est plus visible » avec les rubriques manquantes en liens | unitaire ; e2e `lot15` §3 |
| NAV-03 | Le retour d'une notification revenait aux Conversations | La vue est dans l'adresse (`/messages?tab=notifications`), changée par *replace* | unitaire ; e2e `lot15` §4 (bouton Retour et Précédent) |
| NAV-04 | `/owner/request/amina-b/sent?id=req-1` nommait Lina K. | Redirection vers l'adresse canonique `requestSentPath(request)` ; id inconnu → liste | unitaire ; e2e `lot15` §5 |
| NAV-05 | `/sitter/join/location` sans profil affichait un faux conflit | Les trois étapes d'inscription exigent un profil, sinon introduction | e2e `lot15` §6 |

## 5. Autres défauts trouvés et corrigés

| Défaut | Correction |
|---|---|
| Le formulaire de compte ouvert depuis Compte revenait à la passerelle de connexion (Retour) et à l'Accueil (Enregistrer) | Ouvert depuis Compte ou pour modifier : retour et enregistrement vers Compte. Le bouton dit « Enregistrer » au lieu de « Créer mon compte » quand le compte existe |
| Le retour des étapes « besoin » et « introduction pet-sitter » visait `/start` → `/welcome`, l'écran de première visite, même pour une personne déjà entrée | Repli vers `/`, qui renvoie à l'introduction seulement si nécessaire |
| La boîte pet-sitter montrait « Voir mon profil » pour un profil masqué (page « Ce profil n'existe pas ») | Lien seulement si visible |
| La boîte pet-sitter affichait l'avertissement « ces demandes ont été créées par vous » au-dessus d'une boîte vide d'un profil non publié | Avertissement seulement quand il y a une liste à qualifier |
| Les résultats de recherche n'avaient pas de retour | Retour vers l'Accueil |
| Le lien « Effacer » de l'Aide menait en haut de l'ancien Compte | `/settings#reset`, défilement jusqu'à la carte |
| Trois bascules d'espace différentes (Accueil, Compte, bas de la boîte) | Une bascule dans Compte, une seconde porte sur l'Accueil ; toutes passent par `useSwitchWorkspace` → `workspaceHome` |

## 6. Adresses et compatibilité

Toutes les adresses existantes restent servies, y compris les dix historiques. Changements :

| Adresse | 1.5 | 1.6 |
|---|---|---|
| `/account` | — (404) | **Compte** |
| `/settings` | « Compte » (espaces, langue, outils, effacement) | **Paramètres** (langue, sécurité et confidentialité, effacement, outils). Les espaces sont dans Compte |
| `/messages?tab=notifications` | ignoré | ouvre la vue Notifications |
| `/owner/request/:a/sent?id=` (sitter discordant) | affichait l'autre sitter | redirige vers l'adresse canonique |
| `/sitter/join/*` sans profil | formulaire puis faux conflit | introduction |

Les brouillons, critères, demandes en préparation et sitters choisis ne sont pas touchés : aucun changement de stockage ni de version d'état.

## 7. Propositions documentées (non implémentées)

Ces options s'écartent d'une décision approuvée ou d'une décision produit ; elles ne sont pas appliquées.

1. **Une conversation par couple propriétaire–pet-sitter, demandes incluses** (modèle Rover). Aujourd'hui, une question avant demande est un message (Messages), et une question sur une demande est une clarification (Demandes). Deux endroits pour « parler au pet-sitter ». Les réunir supprimerait une hésitation, mais modifie le modèle de données et la décision « clarification = fil local de la demande » (Audit 1.3).
2. **Notifications.** Une fois une diffusion réelle disponible, le compteur de Messages pourrait inclure les décisions reçues. Aujourd'hui, la décision apparaît dans Notifications et dans le détail de la demande, sans compteur, faute de notion « vu » pour une décision.
3. **Changement d'espace en un geste** (appui long sur Compte, comme les comptes multiples d'Instagram) : utile pour les personnes qui ont les deux rôles, mais caché pour les autres. À évaluer avec des utilisateurs avant d'ajouter un geste.

## 8. Résultats

Environnement : Chromium (Playwright, sans tête), serveur de dev Vite `127.0.0.1:8080`, Node 22. Référence 1.5 mesurée au départ sur le même environnement.

| Contrôle | 1.5 (départ) | 1.6 |
|---|---|---|
| `npm run typecheck` | 0 erreur | 0 erreur |
| `npm run lint` | 0 erreur, 8 avertissements | 0 erreur, les mêmes 8 avertissements (`src/components/ui/*`) |
| `npm run check:locales` | OK | OK (fr/en/ar, pluriels complets) |
| `npm run test:unit` | 79/79 | **98/98** (+19 dans `navigation.test.ts`) |
| `npm run test:e2e` | 352/352 sur 13 fichiers | **406/406 sur 14 fichiers** (nouveau `lot15-navigation-16.mjs` : 52) |
| `node e2e/audit-layout.mjs` (tous les écrans × fr/en/ar × 320→1440 px) | — | **1 113 rendus, 0 problème de mise en page**, 4 troncatures volontaires (aperçus sur 2 lignes, déjà relevées par l'audit) |
| Build de production | OK, chunk principal 239,1 kB gzip | OK, 241,0 kB gzip (+2 kB : le module de navigation) |

Les lots 04, 07, 08, 09, 11 et 13 ont été mis à jour : ils vérifiaient l'ancienne structure (cinq onglets, `/settings` comme Compte, l'icône Messages de l'en-tête, les étapes nom et téléphone pour un propriétaire déjà inscrit). Leur intention est conservée.

Deux problèmes réels relevés par les contrôles pendant la refonte et corrigés : un lien « Voir mon profil » de 20 px de haut sur Mon profil (cible minimale 44 px, lot09), et le compteur de l'en-tête qui recouvrait l'icône sur ordinateur (balayage de mise en page) — le nombre est désormais placé après le libellé.

Captures examinées : 390 px en français (accueil, Compte invité et connecté, Paramètres, Mes animaux, résultats, Messages, boîte pet-sitter en brouillon, Mon profil en brouillon et visible, confirmation masquée), 1 366 px en français (accueil, Compte, Mon profil, Messages) et 320 px en arabe (accueil, Compte, Paramètres, Messages, boîte pet-sitter).

**Non vérifié :** appareils physiques, Safari et Firefox, lecteurs d'écran réels, installation PWA. Les annonces des compteurs sont vérifiées par leur nom accessible, pas avec un lecteur d'écran.
