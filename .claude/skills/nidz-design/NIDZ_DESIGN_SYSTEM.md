# NIDZ — Source maîtresse Produit, UX/UI & Design System
**Version : 1.0 — 11 août 2026**  
**Statut : source de référence pour les modifications produit, UX, UI et front-end de Nidz**

---

## 0. Rôle de ce document

Ce document est la **source de vérité UX/UI de Nidz**.

Il doit être utilisé par ChatGPT, les designers et les développeurs lorsqu’ils :
- créent un nouvel écran ;
- modifient un écran existant ;
- ajoutent ou modifient un composant ;
- changent une couleur, une typographie, un espacement ou une animation ;
- créent un formulaire ;
- modifient un parcours propriétaire ou pet-sitter ;
- travaillent sur le matching ;
- ajoutent un signal de confiance ;
- créent un état vide, chargement, erreur ou succès ;
- travaillent sur l’administration Nidz ;
- refactorisent le design system ;
- proposent une amélioration dite « moderne », « premium », « plus jolie », « plus simple », etc.

Ce document ne doit **pas** être interprété comme une spécification métier définitivement validée.  
Le prototype actuel n’est pas la vérité produit. Les mécanismes de paiement, de réservation, de vérification, d’assurance, de commission, de classement et plusieurs détails opérationnels restent à valider.

### Principe de priorité

Lorsqu’une demande entre en conflit avec plusieurs règles, appliquer cet ordre :

1. **Sécurité, légalité, confidentialité et honnêteté envers l’utilisateur**
2. **Vérité fonctionnelle du produit réellement implémenté**
3. **Confiance et compréhension de l’utilisateur**
4. **Objectif métier et qualité du matching**
5. **Accessibilité et utilisabilité**
6. **Cohérence du design system Nidz**
7. **Préférences esthétiques ponctuelles**
8. **Effets visuels décoratifs**

Une interface plus jolie ne doit jamais devenir moins honnête, moins accessible ou plus ambiguë.

---

# 1. Vérité produit

## 1.1 Définition

**Nidz est une marketplace algérienne de pet-sitting qui met en relation des propriétaires de chiens et de chats avec des pet-sitters de confiance à proximité.**

Nidz ne doit pas se comporter comme un simple catalogue d’annonces.

La proposition de valeur centrale est :

> **Trouver → comprendre → faire confiance → confier son animal sereinement.**

Côté pet-sitter :

> **Présenter réellement sa manière de garder les animaux → recevoir des demandes pertinentes → construire sa réputation → obtenir de nouvelles opportunités.**

---

## 1.2 Le problème fondamental

Le principal problème à résoudre n’est pas :

> « Où trouver quelqu’un ? »

mais :

> **« Est-ce la bonne personne pour mon animal, et ai-je suffisamment d’informations pour lui faire confiance ? »**

Par conséquent, la confiance ne doit pas être traitée comme une couche marketing ajoutée après coup.

**La confiance est une fonction produit.**

---

# 2. Les trois piliers de Nidz

Toute décision produit ou design importante doit améliorer au moins un de ces trois piliers sans détériorer les autres.

## 2.1 Pertinence

Nidz doit aider l’utilisateur à voir en priorité les pet-sitters réellement compatibles avec :
- l’animal ;
- les dates ;
- le type de garde ;
- la localisation ;
- les contraintes de l’animal ;
- l’environnement du pet-sitter ;
- les limites et préférences du pet-sitter.

## 2.2 Confiance

Nidz doit réduire l’incertitude grâce à des informations concrètes, compréhensibles et dont la provenance est claire.

## 2.3 Sérénité

Le parcours doit être calme, progressif et prévisible.  
L’utilisateur doit savoir :
- ce qui lui est demandé ;
- pourquoi Nidz le demande ;
- ce qui va se passer ensuite ;
- ce qui est confirmé ;
- ce qui ne l’est pas encore.

---

# 3. Personnalité de marque et sensation recherchée

Nidz doit paraître :

- calme ;
- humain ;
- fiable ;
- chaleureux ;
- propre ;
- contemporain ;
- accessible ;
- local sans être folklorique ;
- professionnel sans être froid ;
- rassurant sans prétendre garantir l’impossible.

Nidz ne doit pas paraître :

- enfantin ;
- « cartoon » ;
- agressivement commercial ;
- luxueux au point de devenir distant ;
- clinique ;
- bancaire ;
- surchargé ;
- rempli de badges ;
- gamifié sans raison ;
- similaire à une animalerie ;
- similaire à un site de petites annonces générique.

### Formule visuelle

> **Chaleur humaine + rigueur fonctionnelle + faible bruit visuel.**

---

# 4. Philosophie UX fondamentale

## 4.1 Clarté avant décoration

Avant d’ajouter un effet visuel, vérifier si le problème peut être résolu par :
- la hiérarchie ;
- le texte ;
- le regroupement ;
- l’espacement ;
- la position ;
- le contraste ;
- la suppression d’informations inutiles.

## 4.2 Une décision dominante par contexte

Une page peut comporter plusieurs actions, mais elle ne doit généralement avoir qu’une **action visuellement dominante**.

Exemple :
- action principale : « Envoyer la demande »
- secondaire : « Poser une question »
- tertiaire : « Ajouter aux favoris »

Ne pas afficher trois gros boutons de même importance.

## 4.3 Réduire la charge cognitive, pas nécessairement le nombre d’éléments

« Minimaliste » ne veut pas dire vide.

Supprimer une information nécessaire peut augmenter l’incertitude.

La simplicité Nidz signifie :
- informations pertinentes ;
- organisées ;
- présentées au bon moment ;
- dans un ordre logique ;
- avec le minimum de compétition visuelle.

## 4.4 Reconnaissance avant mémorisation

Ne pas obliger l’utilisateur à se souvenir d’informations présentées ailleurs.

Exemples :
- conserver les labels des champs visibles ;
- rappeler l’animal concerné dans une demande ;
- rappeler dates et type de garde dans la conversation ;
- afficher le contexte avant confirmation.

## 4.5 Divulgation progressive

Ne demander une information que lorsqu’elle devient utile.

Éviter les inscriptions qui ressemblent immédiatement à un dossier administratif.

Exemple :
1. découverte ;
2. besoin ;
3. animal ;
4. localisation/dates ;
5. résultats ;
6. informations supplémentaires lorsque l’utilisateur veut contacter ou réserver.

Mais ne pas transformer une tâche simple en dix écrans artificiels.

---

# 5. Psychologie perceptive appliquée

## 5.1 Proximité

Les éléments proches sont perçus comme appartenant au même groupe.

Utiliser d’abord l’espace pour organiser une page avant d’ajouter :
- cadres ;
- fonds colorés ;
- séparateurs ;
- cartes imbriquées.

## 5.2 Similarité

Des éléments ayant la même apparence doivent avoir une fonction ou un niveau d’importance similaire.

**Même fonction → même apparence.**

Un bouton primaire Nidz ne doit pas changer arbitrairement de couleur selon les pages.

## 5.3 Hiérarchie visuelle

L’ordre de lecture doit être perceptible sans effort grâce à :
- taille ;
- graisse ;
- contraste ;
- position ;
- espace ;
- couleur utilisée avec parcimonie.

## 5.4 Chunking

Les informations longues doivent être regroupées en unités compréhensibles.

Un profil pet-sitter peut par exemple être divisé en :
- À propos ;
- Expérience ;
- Animaux acceptés ;
- Environnement de garde ;
- Disponibilités ;
- Conditions ;
- Avis.

Éviter un mur de texte ou une mosaïque de 25 badges.

---

# 6. Architecture de confiance Nidz

Tout signal de confiance doit appartenir explicitement à l’une des catégories suivantes.

## A. Déclaré par l’utilisateur

Exemples :
- « 5 ans d’expérience » ;
- « J’accepte les grands chiens » ;
- « Je vis dans une maison avec jardin » ;
- « Je n’ai pas de chat ».

Ce contenu est informatif mais **n’est pas une vérification Nidz**.

Lorsque nécessaire, le langage doit indiquer qu’il s’agit d’informations fournies par le pet-sitter.

## B. Vérifié

N’utiliser le mot « vérifié », un check de vérification ou un badge assimilable à une certification que si Nidz a réellement exécuté un processus défini et traçable.

Exemples possibles uniquement si le mécanisme existe :
- identité vérifiée ;
- téléphone vérifié ;
- document professionnel vérifié.

**Profil complet ≠ profil vérifié.**

## C. Généré par la communauté

Exemples :
- avis ;
- note ;
- commentaires après une garde.

Privilégier les avis pouvant être reliés à une interaction ou garde réelle lorsque le système permet de l’établir.

## D. Observé par la plateforme

Exemples uniquement lorsque Nidz dispose des données :
- délai de réponse ;
- nombre de gardes réalisées via Nidz ;
- taux de réponse ;
- ancienneté ;
- réservations répétées.

Ne jamais inventer ces métriques.

---

## 6.1 Interdictions absolues de confiance

Ne pas afficher sans mécanisme réel :
- « 100 % sécurisé » ;
- « sécurité garantie » ;
- « pet-sitter certifié Nidz » ;
- « assuré par Nidz » ;
- « paiement protégé » ;
- « réservation garantie » ;
- « vérifié » ;
- « contrôle des antécédents effectué » ;
- toute promesse équivalente.

Si une fonctionnalité n’existe pas, la formulation UX ne doit pas laisser penser qu’elle existe.

---

# 7. Réputation : montrer sans manipuler

La réputation réduit l’incertitude, mais elle ne doit pas devenir un faux résumé de la personne.

Afficher lorsque disponible :
- note ;
- nombre d’avis ;
- contenu des avis ;
- date/ancienneté des avis ;
- contexte de la garde si pertinent.

Éviter :
- badges décoratifs en cascade ;
- scores opaques ;
- « Top 1 % » sans méthodologie ;
- fausse urgence ;
- avis fictifs ou préremplis.

### Cold start des nouveaux pet-sitters

Un nouveau pet-sitter ne doit pas être automatiquement considéré comme mauvais parce qu’il n’a pas encore d’avis.

Pour les nouveaux profils, valoriser de manière honnête :
- complétude du profil ;
- informations concrètes ;
- disponibilité ;
- compatibilité ;
- expérience déclarée clairement identifiée comme telle ;
- éventuelles vérifications réellement effectuées.

---

# 8. Matching Nidz

Le matching doit être compréhensible et défendable.

## 8.1 Séparer contraintes dures et préférences souples

### Contraintes dures possibles
Un profil peut être exclu lorsque :
- le pet-sitter n’accepte pas l’espèce ;
- les dates ne correspondent pas ;
- la taille de l’animal dépasse une limite déclarée ;
- une incompatibilité avec les animaux présents est explicitement connue ;
- le service demandé n’est pas proposé ;
- la zone géographique est hors périmètre.

### Préférences / signaux de pertinence
Peuvent contribuer au classement :
- distance ;
- expérience pertinente ;
- environnement ;
- préférences de l’animal ;
- qualité/complétude du profil ;
- historique de gardes lorsque disponible ;
- réputation ;
- réactivité lorsque réellement mesurée.

---

## 8.2 Expliquer le matching

Préférer :

> **Bien adapté à Milo**
>
> Disponible aux dates demandées · accepte les grands chiens · aucun chat déclaré au domicile

plutôt qu’un score artificiel :

> **93 % MATCH**

sauf si le score correspond un jour à un modèle véritablement défini, testé et explicable.

### Règle

> **Explication concrète > précision numérique fictive.**

---

## 8.3 Le matching ne doit pas être une boîte noire décorative

ChatGPT ne doit jamais inventer :
- un algorithme IA ;
- un pourcentage de compatibilité ;
- un « Nidz Score » ;
- un score de sécurité ;
- un classement personnalisé ;

si les données et la logique correspondantes ne sont pas réellement implémentées.

---

# 9. Parcours propriétaire

## 9.1 Découverte

L’utilisateur doit pouvoir comprendre Nidz avant de fournir beaucoup d’informations.

Message de base :

> **Trouvez une personne de confiance pour prendre soin de votre animal.**

La page d’accueil doit privilégier :
- proposition de valeur ;
- compréhension ;
- profils ou exemples crédibles ;
- appel à l’action simple.

Éviter les longs blocs marketing au-dessus du contenu principal.

## 9.2 Définition du besoin

Demander progressivement :
- animal ;
- localisation ;
- dates ;
- type de garde ;
- contraintes essentielles.

Expliquer les demandes sensibles ou inhabituelles.

## 9.3 Résultats

La page résultats doit répondre rapidement :
1. Qui correspond ?
2. Pourquoi cette personne correspond ?
3. Où est-elle approximativement ?
4. Quand est-elle disponible ?
5. Quels éléments permettent de lui faire confiance ?
6. Que dois-je faire pour en savoir plus ?

## 9.4 Profil pet-sitter

L’ordre recommandé est :

1. identité visuelle de la personne ;
2. résumé clair ;
3. raisons de compatibilité avec l’animal/besoin ;
4. principaux signaux de confiance ;
5. expérience ;
6. environnement ;
7. animaux acceptés / limites ;
8. disponibilités ;
9. conditions ;
10. avis ;
11. action de contact/demande.

L’information la plus importante doit apparaître avant les détails secondaires.

## 9.5 Contact / demande

La demande doit reprendre explicitement :
- animal ;
- dates ;
- service ;
- informations importantes.

L’utilisateur doit comprendre si son action :
- ouvre une conversation ;
- envoie une demande ;
- effectue une réservation ;
- demande une validation au pet-sitter.

Ne pas utiliser « Réserver » si techniquement l’action n’effectue pas une réservation.

## 9.6 Après la garde

Lorsque la garde peut être établie par le système :
- solliciter un avis ;
- faciliter une nouvelle demande ;
- construire l’historique.

---

# 10. Parcours pet-sitter

Le profil pet-sitter n’est pas une annonce libre.

Il doit aider la personne à produire une présentation utile et comparable.

## Sections possibles

- présentation ;
- expérience ;
- espèces acceptées ;
- tailles / profils d’animaux acceptés ;
- environnement ;
- animaux présents ;
- enfants présents si pertinent et volontairement collecté ;
- type de logement ;
- espace extérieur si pertinent ;
- conditions ;
- disponibilités ;
- préférences et limites ;
- localisation ;
- compétences ou expérience professionnelle ;
- photos appropriées.

### Principe UX

Préférer des questions concrètes à :

> « Décrivez-vous »

Exemple :
- « Avec quels animaux avez-vous le plus d’expérience ? »
- « Quels animaux pouvez-vous accueillir ? »
- « D’autres animaux vivent-ils chez vous ? »
- « Y a-t-il des situations que vous ne pouvez pas accepter ? »

Le profil doit devenir riche grâce à une **structure intelligente**, pas grâce à un formulaire interminable.

---

# 11. Design visuel Nidz — direction active V1

Cette section constitue le langage visuel actif jusqu’à décision explicite de le modifier.

## 11.1 Intention

Le design doit évoquer :
- sérénité ;
- nature sans cliché ;
- chaleur ;
- crédibilité ;
- proximité humaine.

L’esthétique ne doit pas dépendre de dizaines de couleurs ou d’effets.

---

# 12. Couleurs

## 12.1 Règle fondamentale

Utiliser des **tokens sémantiques**, jamais des couleurs arbitraires dispersées dans les composants.

### Palette principale V1

| Token | Valeur | Usage |
|---|---:|---|
| `background` | `#FBFAF7` | fond principal chaud |
| `surface` | `#FFFFFF` | cartes, modales, surfaces élevées |
| `foreground` | `#18211F` | texte principal |
| `muted-foreground` | `#5B6864` | texte secondaire |
| `primary` | `#0F766E` | actions principales, sélection, marque |
| `primary-hover` | `#115E59` | état hover/pressed |
| `primary-soft` | `#E7F3F1` | fonds doux liés au primaire |
| `accent` | `#A84F32` | accent chaleureux rare |
| `accent-soft` | `#F7EAE4` | fond d’accent doux |
| `border` | `#DCE3E0` | séparateurs non critiques |
| `control-border` | `#7C8B86` | contour fonctionnel des champs/contrôles |
| `success` | `#166534` | succès |
| `warning` | `#9A5700` | avertissement |
| `destructive` | `#B91C1C` | erreur/destruction |
| `info` | `#1D4ED8` | information nécessitant une couleur distincte |

### Utilisation

Le vert-bleu `primary` est la couleur d’action dominante.

L’accent chaud :
- ne concurrence pas le CTA principal ;
- sert avec parcimonie à humaniser l’identité ;
- peut soutenir des illustrations, éléments de marque ou contenus éditoriaux.

Le rouge :
- n’est pas décoratif ;
- reste réservé au danger, erreur et destruction.

Le vert succès :
- n’est pas utilisé simplement parce qu’un élément est « positif » ;
- sert à confirmer un état ou résultat.

---

## 12.2 Couleur et accessibilité

Objectif minimum :
- texte normal : contraste WCAG AA ≥ 4.5:1 ;
- grand texte : ≥ 3:1 ;
- composants/indications graphiques nécessaires : viser ≥ 3:1 ;
- ne jamais transmettre une information uniquement par la couleur.

Le système V1 utilise volontairement des couleurs principales foncées pour permettre des contrastes élevés sur surfaces claires.

---

# 13. Typographie

## 13.1 Police d’interface

**Inter** reste la police par défaut pour :
- navigation ;
- formulaires ;
- boutons ;
- cartes ;
- profils ;
- messages ;
- administration ;
- données.

Elle doit porter l’essentiel du produit.

## 13.2 Playfair Display

**Playfair Display est une police d’expression de marque, pas une police d’interface.**

Elle peut être utilisée :
- dans certains grands titres marketing ;
- sur la landing page ;
- dans un moment éditorial clairement assumé.

Elle ne doit pas être utilisée :
- dans les formulaires ;
- pour les boutons ;
- pour les textes longs ;
- dans les tableaux ;
- dans l’administration ;
- comme décoration répétée.

### Règle

> Maximum un rôle typographique Playfair dominant par écran marketing ; zéro obligation de l’utiliser dans l’application transactionnelle.

---

## 13.3 Échelle typographique recommandée

| Rôle | Taille indicative |
|---|---|
| `caption` | 12–13 px |
| `small` | 14 px |
| `body` | 16 px |
| `body-lg` | 18 px |
| `h3` | 20 px |
| `h2` | 24–28 px |
| `h1` | 32–40 px |
| `display` | 40–56 px selon viewport |

Graisses principales :
- 400 ;
- 500 ;
- 600 ;
- 700 exceptionnellement.

Ne pas multiplier les tailles arbitraires.

Les tailles doivent rester adaptables au viewport et au zoom.

---

# 14. Espacement

Utiliser une échelle cohérente :

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

Les exceptions doivent être justifiées par le layout, pas par l’habitude d’ajouter une valeur arbitraire.

### Règles pratiques

- petit espace interne : 8–12 ;
- contrôle/champ : 12–16 ;
- groupe logique : 16–24 ;
- séparation de sections : 32–48 ;
- grande respiration éditoriale : 48–64+.

L’espace sert de structure.

---

# 15. Grille et responsive

Nidz est conçu en priorité pour une expérience très confortable sur téléphone, tout en restant excellent sur desktop.

### Marges indicatives

- mobile : 16 px ;
- large mobile/tablette : 20–24 px ;
- desktop : 24–32 px.

### Largeurs

- contenu transactionnel / formulaire : environ 560–720 px max ;
- profil riche : environ 960–1120 px selon composition ;
- résultats marketplace : jusqu’à environ 1200–1280 px lorsque pertinent.

Ne pas étirer les paragraphes sur toute la largeur d’un grand écran.

### Responsive

Le responsive ne signifie pas simplement réduire les colonnes.

Il peut nécessiter de :
- modifier l’ordre ;
- rendre l’action principale sticky en bas sur mobile ;
- transformer une sidebar en drawer ;
- réduire les informations secondaires ;
- rendre les filtres accessibles via sheet ;
- préserver le contexte.

---

# 16. Formes, bordures et ombres

## Rayons

Base recommandée :
- `radius-sm`: 8 px ;
- `radius-md`: 12 px ;
- `radius-lg`: 16 px ;
- `radius-xl`: 20–24 px pour grandes surfaces spécifiques.

Les pills totalement rondes sont réservées aux éléments qui ont réellement une logique de pill :
- tags ;
- filtres ;
- statuts ;
- petits toggles.

Ne pas transformer tous les boutons et toutes les cartes en capsules.

## Ombres

Préférer :
1. espace ;
2. changement de surface ;
3. bordure ;
4. ombre légère.

Les ombres fortes sont réservées aux éléments réellement élevés :
- popovers ;
- dialogs ;
- menus flottants.

Éviter les cartes avec de grosses ombres « SaaS template ».

---

# 17. Boutons et hiérarchie d’action

## Types

### Primary
Action principale du contexte.

### Secondary
Action importante mais non dominante.

### Tertiary / ghost
Action légère.

### Destructive
Action dangereuse ou irréversible.

### Link
Navigation ou action textuelle véritablement secondaire.

## Règles

- un seul primary dominant dans une zone de décision ;
- libellé décrivant le résultat : « Envoyer la demande », pas « OK » ;
- icône seule uniquement si le sens est évident ou si un label accessible existe ;
- afficher clairement loading, disabled, success ou erreur lorsque pertinent ;
- ne pas désactiver silencieusement un bouton sans expliquer ce qui manque.

### Taille de cible Nidz

Même si WCAG 2.2 AA définit un minimum plus faible dans certains cas, Nidz vise **en pratique des cibles tactiles d’environ 44×44 CSS px ou plus pour les actions importantes**, afin d’être confortable sur mobile.

---

# 18. Champs et formulaires

Toujours :
- label visible ;
- format attendu si nécessaire ;
- aide contextualisée ;
- erreur près du champ ;
- état focus évident ;
- valeurs conservées après erreur lorsque possible.

Éviter :
- placeholder utilisé comme seul label ;
- validation rouge sans texte ;
- formulaires gigantesques sans regroupement ;
- demandes d’informations non justifiées.

### Erreur

Mauvais :
> Erreur 422.

Meilleur :
> **Impossible d’enregistrer votre profil. Vérifiez les champs indiqués.**

Spécifique :
> **Indiquez au moins une espèce que vous pouvez garder.**

---

# 19. Cartes de pet-sitters

Une carte de résultat n’est pas une mini-page de profil.

Elle doit aider à décider si le profil mérite d’être ouvert.

### Priorité possible

1. photo ;
2. prénom / identité publique définie ;
3. distance ou zone approximative lorsque disponible ;
4. courte description utile ;
5. raisons de compatibilité ;
6. réputation réelle ;
7. information tarifaire si le modèle la prévoit ;
8. disponibilité pertinente ;
9. action d’ouverture.

### Ne pas afficher simultanément

- 9 badges ;
- 8 icônes ;
- 4 couleurs ;
- 3 CTA ;
- de longs paragraphes.

### Raison de compatibilité

Des chips sobres peuvent afficher :
- « Accepte les grands chiens »
- « Disponible »
- « Sans chat déclaré »

mais ne pas transformer toute information en badge.

---

# 20. Profil pet-sitter détaillé

Le profil doit répondre à cette question :

> **« Puis-je imaginer concrètement comment mon animal sera gardé par cette personne ? »**

Les photos et informations doivent aider à comprendre :
- la personne ;
- l’environnement ;
- l’expérience ;
- les contraintes ;
- la compatibilité.

Éviter les profils qui reposent principalement sur :
- slogans ;
- emojis ;
- qualificatifs vagues ;
- auto-évaluations non vérifiables.

---

# 21. Photographies et iconographie

## Photos

Pour une marketplace de confiance, privilégier des photos :
- authentiques ;
- nettes ;
- suffisamment lumineuses ;
- permettant d’identifier correctement la personne lorsque la politique le permet ;
- illustrant l’environnement lorsque cela est pertinent.

Ne pas remplacer les vraies informations par des photos stock génériques.

## Icônes

Utiliser une seule famille cohérente dans l’application.

Avec shadcn/ui, une famille comme **Lucide** est appropriée si elle est déjà celle du projet.

Éviter de mélanger :
- Lucide ;
- emoji ;
- Material ;
- Font Awesome ;
- SVG de styles différents.

Les emoji peuvent éventuellement apparaître dans du contenu marketing ponctuel, pas devenir le langage d’interface principal.

---

# 22. Navigation

La navigation doit refléter les tâches réelles, pas l’organigramme de Nidz.

Côté propriétaire, des destinations possibles peuvent être :
- Découvrir / Rechercher ;
- Demandes ;
- Messages ;
- Mes animaux ;
- Profil / compte.

Côté pet-sitter :
- Demandes ;
- Messages ;
- Disponibilités ;
- Mon profil de garde ;
- Compte.

Ne pas créer deux applications entièrement séparées si une même personne peut progressivement avoir les deux usages.

Ne demander « propriétaire ou pet-sitter ? » que lorsque ce choix est nécessaire.

---

# 23. Feedback et états

Tout composant important doit considérer ses états :

- default ;
- hover ;
- focus-visible ;
- active / pressed ;
- disabled ;
- loading ;
- success ;
- error.

Toute page de données doit considérer :

- loading ;
- empty ;
- partial ;
- success ;
- error ;
- offline lorsque pertinent.

## États vides

Un état vide doit :
1. expliquer ce qui manque ;
2. indiquer ce que l’utilisateur peut faire ;
3. ne pas donner l’impression d’une erreur.

Exemple :
> **Aucune demande pour le moment**
>
> Lorsque des propriétaires vous contacteront pour une garde correspondant à votre profil, leurs demandes apparaîtront ici.

---

# 24. Motion

L’animation doit servir :
- la causalité ;
- le feedback ;
- l’orientation spatiale ;
- les changements d’état.

Durées indicatives :
- micro-feedback : 100–150 ms ;
- transition standard : 160–220 ms ;
- dialog/sheet : 200–300 ms.

Éviter :
- rebonds décoratifs ;
- parallax gratuit ;
- éléments qui flottent en permanence ;
- longues animations de chargement ;
- effets qui retardent une action.

Respecter `prefers-reduced-motion`.

---

# 25. Accessibilité

Nidz doit viser au minimum **WCAG 2.2 AA** pour le web.

## Exigences

- contraste suffisant ;
- navigation clavier ;
- focus visible ;
- HTML sémantique ;
- labels de formulaires ;
- noms accessibles pour icônes/actions ;
- alt text utile pour images informatives ;
- zoom texte sans perte majeure de fonctionnalité ;
- information non transmise uniquement par couleur ;
- ordre DOM logique ;
- erreurs compréhensibles ;
- zones tactiles confortables.

### Focus

Ne jamais supprimer l’outline sans fournir un remplacement visible.

### Couleur

Une erreur doit avoir :
- couleur ;
- texte ;
- éventuellement icône.

Pas seulement une bordure rouge.

---

# 26. UX Writing

La voix de Nidz doit être :
- simple ;
- calme ;
- directe ;
- respectueuse ;
- non technique ;
- non alarmiste ;
- non infantilisante.

## Règles

Préférer :
> « Envoyer la demande »

à :
> « Soumettre »

Préférer :
> « Cette personne n’est pas disponible à ces dates. »

à :
> « Match impossible. »

Préférer :
> « Informations fournies par le pet-sitter »

à :
> une formulation suggérant une validation Nidz inexistante.

## Ton animalier

Ne pas transformer chaque phrase en :
- jeu de mots ;
- « wouf » ;
- « miaou » ;
- patte ;
- emoji.

La chaleur vient du langage humain, pas d’une accumulation de gimmicks.

---

# 27. Confidentialité et localisation

La localisation est utile au matching mais peut devenir une information sensible.

Par défaut :
- ne pas révéler publiquement une adresse exacte sans nécessité et politique explicite ;
- privilégier zone, quartier ou distance approximative lorsque cela suffit ;
- afficher l’adresse précise seulement au moment approprié du parcours et selon les règles produit réelles ;
- expliquer pourquoi la localisation est demandée.

Ne jamais créer de carte qui expose involontairement le domicile exact d’un utilisateur.

---

# 28. Paiement, réservation et modèle économique

Ces éléments sont **non figés**.

Nidz ne doit pas supposer dans l’UI qu’il existe :
- un paiement intégré ;
- une commission précise ;
- une garantie financière ;
- un séquestre ;
- un remboursement automatique ;
- une assurance ;
- une réservation instantanée.

Les paiements électroniques existent en Algérie et continuent d’évoluer ; le produit doit rester techniquement capable d’intégrer des moyens locaux pertinents, mais la stratégie doit être validée avant de figer le parcours.

### Règle pour ChatGPT

Si le code actuel contient un placeholder de paiement, ne pas le transformer en promesse commerciale définitive.

---

# 29. Adaptation algérienne

Nidz ne doit pas être Rover traduit.

La conception doit tenir compte des hypothèses locales fournies par l’équipe :
- importance de la confiance et du bouche-à-oreille ;
- densité de l’offre très différente selon les territoires ;
- habitudes de paiement locales ;
- sensibilité au prix ;
- importance du mobile et des canaux sociaux ;
- marché de pet-sitting encore à structurer.

Ces éléments doivent être traités comme des **hypothèses produit à valider par recherche terrain et données**, sauf lorsqu’ils sont soutenus par une source externe actualisée.

### Couverture géographique

Ne jamais hardcoder « 48 wilayas ».

Le découpage territorial algérien a évolué et évolue encore. En 2026, une réforme prévoit un découpage à 69 wilayas avec transition opérationnelle annoncée. Les référentiels de wilayas doivent donc être maintenus comme **données actualisables**, pas comme constante écrite dans l’interface.

### Lancement

La logique marketplace favorise un lancement concentré :
- créer suffisamment d’offre dans une zone ;
- créer suffisamment de demande dans la même zone ;
- mesurer les matchs et gardes ;
- étendre ensuite.

Ne pas valoriser artificiellement une « couverture nationale » si elle produit des résultats vides.

---

# 30. Mobile-first sans mobile-only

Le téléphone doit être un contexte prioritaire.

Les parcours critiques doivent être réalisables confortablement :
- à une main lorsque possible ;
- avec cibles larges ;
- sans hover obligatoire ;
- avec formulaires courts ;
- avec clavier mobile ;
- sans tableau horizontal illisible.

Desktop doit cependant être exploité intelligemment pour :
- comparaison ;
- administration ;
- édition de profil riche ;
- résultats plus denses.

---

# 31. Administration Nidz

L’administration peut être plus dense que l’application grand public.

Elle garde :
- la même sémantique de couleurs ;
- les mêmes composants fondamentaux ;
- les mêmes règles d’accessibilité.

Mais elle peut utiliser :
- tables ;
- filtres ;
- colonnes ;
- panneaux latéraux ;
- densité supérieure ;
- actions de masse soigneusement protégées.

## Domaines possibles

- utilisateurs ;
- profils pet-sitters ;
- demandes ;
- signalements ;
- incidents ;
- modération ;
- activité ;
- données marketplace ;
- métriques.

Les actions destructives ou sensibles doivent demander le niveau de confirmation approprié et laisser une trace lorsque le système le prévoit.

---

# 32. Design system technique

Stack actuelle :
- React ;
- TypeScript ;
- Vite ;
- Tailwind CSS ;
- shadcn/ui.

## Principe

Utiliser les capacités de thèmes sémantiques de shadcn/ui et Tailwind.

Ne pas disperser :
```tsx
bg-[#0F766E]
text-[#18211F]
rounded-[13px]
```
dans les composants si une variable ou un token existe.

Préférer :
```tsx
bg-primary
text-foreground
rounded-md
```

et définir les valeurs dans le thème.

### Tokens minimaux

```text
color.background
color.surface
color.foreground
color.mutedForeground
color.primary
color.primaryHover
color.primarySoft
color.accent
color.accentSoft
color.border
color.controlBorder
color.success
color.warning
color.destructive
color.info

space.1 = 4
space.2 = 8
space.3 = 12
space.4 = 16
space.6 = 24
space.8 = 32
space.12 = 48
space.16 = 64

radius.sm = 8
radius.md = 12
radius.lg = 16
radius.xl = 24
```

---

# 33. Règles de code front-end

Lorsque ChatGPT modifie le code :

1. Inspecter les composants existants avant d’en créer un nouveau.
2. Réutiliser shadcn/ui ou les primitives Nidz lorsque possible.
3. Conserver le HTML sémantique.
4. Ne pas résoudre chaque variante avec des classes arbitraires.
5. Créer des variantes de composant lorsqu’un motif est récurrent.
6. Garder les données métier séparées de la présentation.
7. Ne pas inventer des données utilisateur réelles.
8. Ne pas hardcoder des textes si l’internationalisation du projet les externalise déjà.
9. Préserver les états clavier et focus.
10. Tester mentalement mobile, desktop, loading, empty et error.
11. Respecter `prefers-reduced-motion`.
12. Ne pas introduire de dépendance UI supplémentaire uniquement pour un effet esthétique mineur.

---

# 34. Internationalisation

Le prototype prévoit une infrastructure d’internationalisation.

Par conséquent :
- éviter les dimensions dépendant d’un mot français court ;
- laisser les boutons accepter des labels plus longs ;
- ne pas intégrer le texte directement dans des images ;
- prévoir la possibilité de RTL si l’arabe devient une langue produit ;
- utiliser des propriétés CSS logiques lorsque pertinent ;
- ne pas considérer la langue du prototype comme une limitation définitive.

Les langues réellement proposées au lancement restent une décision produit.

---

# 35. Carte et géolocalisation

Une carte ne doit être ajoutée que si elle améliore la décision.

Pour une faible densité de pet-sitters, une liste claire peut être plus utile qu’une grande carte vide.

La carte peut devenir plus importante lorsque :
- suffisamment de profils sont disponibles ;
- la distance est discriminante ;
- l’utilisateur veut explorer une zone.

Toujours préserver la confidentialité de l’adresse.

---

# 36. Indicateurs de qualité à surveiller

Le design ne doit pas être jugé uniquement par « c’est joli ».

Selon les capacités réelles du produit, surveiller progressivement :

- temps jusqu’au premier profil pertinent ;
- taux recherche → profil ;
- profil → contact/demande ;
- demandes acceptées ;
- temps de réponse ;
- conversation → garde confirmée lorsque mesurable ;
- taux de garde réussie lorsque définissable ;
- avis après garde ;
- répétition propriétaire ↔ pet-sitter ;
- activation des nouveaux pet-sitters ;
- résultats sans offre ;
- abandon dans l’onboarding ;
- signalements/incidents.

### North Star comportementale

La vraie preuve de valeur n’est pas :
> nombre de comptes créés

mais quelque chose de plus proche de :
> **des propriétaires et pet-sitters compatibles qui arrivent réellement à une garde réussie et souhaitent recommencer.**

La métrique exacte doit être définie selon le système de réservation réellement disponible.

---

# 37. Tests produit prioritaires

Avant d’ajouter de nombreuses fonctionnalités, chercher à valider :

1. Des propriétaires ont-ils réellement besoin d’une solution autre que leur réseau personnel ?
2. Quelles situations déclenchent le plus fortement ce besoin ?
3. Quels signaux leur permettent réellement de faire confiance ?
4. Quelles informations sont indispensables avant un premier contact ?
5. Existe-t-il suffisamment de pet-sitters capables de produire une offre fiable ?
6. Quel niveau de structuration du profil améliore le matching sans décourager les sitters ?
7. À quelle distance les utilisateurs acceptent-ils une garde ?
8. Quels types de garde ont une demande suffisante ?
9. Comment le paiement est-il réellement effectué ?
10. À quel moment les utilisateurs sortent-ils de la plateforme ?
11. Quels incidents ou inquiétudes apparaissent avant, pendant et après la garde ?

---

# 38. Ce qui ne doit pas être optimisé trop tôt

Ne pas investir excessivement avant validation dans :
- gamification ;
- niveaux de fidélité ;
- système complexe de points ;
- dizaines de badges ;
- IA de recommandation présentée comme sophistiquée ;
- animations premium ;
- dark mode si non prioritaire ;
- très grande administration analytique ;
- paiement complexe ;
- abonnement ;
- programme de parrainage complexe ;
- couverture nationale fictive ;
- fonctionnalités sociales généralistes.

Chaque fonction doit démontrer qu’elle aide :
**matching, confiance ou garde réussie.**

---

# 39. Règles spécifiques pour les demandes futures à ChatGPT

Cette section doit guider directement les futures réponses.

## Si l’utilisateur dit :
### « Rends la page plus moderne »

Ne pas ajouter automatiquement :
- gradient ;
- glassmorphism ;
- couleurs supplémentaires ;
- grosses ombres ;
- animations ;
- cards partout.

Analyser d’abord :
- hiérarchie ;
- alignement ;
- densité ;
- espacement ;
- typographie ;
- contraste ;
- cohérence des composants ;
- qualité des états.

---

## Si l’utilisateur dit :
### « La page est trop vide »

Ne pas remplir le vide par décoration.

Vérifier :
- manque-t-il une information utile ?
- la hiérarchie est-elle trop faible ?
- les groupes sont-ils mal structurés ?
- le contenu manque-t-il réellement ?
- l’espace est-il intentionnel ?

Ajouter du contenu uniquement s’il améliore la décision.

---

## Si l’utilisateur dit :
### « Ajoute un bouton »

Déterminer :
1. quelle action il déclenche ;
2. son niveau d’importance ;
3. s’il est primaire, secondaire, tertiaire ou destructif ;
4. l’état loading ;
5. l’état disabled ;
6. le feedback après action ;
7. son comportement clavier/mobile.

---

## Si l’utilisateur dit :
### « Ajoute un badge »

Déterminer d’abord :
- est-ce réellement un statut ?
- qui l’attribue ?
- sur quelle donnée ?
- est-il déclaré, vérifié, communautaire ou observé ?
- peut-il tromper l’utilisateur ?

Ne pas créer un badge uniquement pour décorer.

---

## Si l’utilisateur dit :
### « Mets cette section en rouge/vert »

Vérifier la sémantique.

Rouge = danger/erreur/destruction.  
Vert de succès = confirmation/succès.  
Primary = action principale.

Ne pas modifier le sens du système de couleurs pour une préférence locale ponctuelle.

---

## Si l’utilisateur dit :
### « Fais comme Apple »

Interpréter comme :
- clarté ;
- hiérarchie ;
- contenu prioritaire ;
- interactions prévisibles ;
- mouvement fonctionnel ;
- typographie lisible ;
- accessibilité ;
- faible bruit visuel.

Ne pas copier mécaniquement :
- effets de verre ;
- composants iOS ;
- apparence native Apple ;

dans une web app où ils n’améliorent pas la tâche.

---

## Si l’utilisateur dit :
### « Fais plus premium »

Interpréter d’abord comme :
- meilleure typographie ;
- meilleurs espaces ;
- meilleure photographie ;
- meilleur alignement ;
- meilleure hiérarchie ;
- microcopy plus précise ;
- réduction du bruit ;
- détails d’interaction plus propres.

Pas comme :
- plus de luxe visuel ;
- noir + or ;
- gradients ;
- ombres massives.

---

# 40. Anti-patterns Nidz

Éviter par défaut :

- cartes imbriquées dans des cartes sans nécessité ;
- gradient sur chaque CTA ;
- ombre sur chaque bloc ;
- 5 couleurs de marque concurrentes ;
- glassmorphism généralisé ;
- emojis comme système d’icônes ;
- texte gris trop clair ;
- labels qui disparaissent à la saisie ;
- bouton « OK » ;
- CTA concurrents ;
- modale pour une tâche qui peut rester inline ;
- carousel marketing inutile ;
- faux compteurs ;
- faux avis ;
- faux badges ;
- faux utilisateurs ;
- faux indicateurs « en ligne » ;
- urgence artificielle ;
- dark patterns ;
- score de confiance opaque ;
- score de matching fictif ;
- information importante cachée uniquement dans une tooltip ;
- hover obligatoire sur mobile ;
- suppressions sans confirmation lorsque l’impact est important ;
- formulaires sans état erreur ;
- loading sans feedback ;
- skeletons infinis ;
- photos stock présentées comme profils réels.

---

# 41. Checklist avant toute modification UI importante

ChatGPT doit pouvoir répondre mentalement à ces questions :

### Produit
- Quel problème cette modification résout-elle ?
- Aide-t-elle matching, confiance ou sérénité ?

### Information
- Quelle est l’information la plus importante ?
- Qu’est-ce qui est secondaire ?
- Peut-on supprimer quelque chose ?

### Action
- Quelle est l’action principale ?
- Le résultat du clic est-il évident ?

### Confiance
- Une affirmation semble-t-elle plus vérifiée qu’elle ne l’est réellement ?
- La provenance des signaux est-elle claire ?

### Design
- Les tokens existants suffisent-ils ?
- La hiérarchie est-elle claire sans décoration supplémentaire ?
- Les espaces sont-ils cohérents ?

### Accessibilité
- Contraste ?
- clavier ?
- focus ?
- label ?
- cible tactile ?
- couleur non exclusive ?
- reduced motion ?

### Responsive
- mobile ?
- desktop ?
- texte long ?
- contenu vide ?
- erreur ?
- loading ?

### Technique
- composant réutilisable ?
- données séparées de l’UI ?
- i18n préservée ?
- dépendance supplémentaire réellement nécessaire ?

---

# 42. Niveau d’autorité des décisions

## Niveau 1 — Principes quasi immuables
Ne changer qu’avec raison produit forte :
- confiance honnête ;
- clarté ;
- accessibilité ;
- provenance des signaux ;
- absence de promesse fictive ;
- une hiérarchie claire ;
- design sémantique ;
- mobile utilisable ;
- données sensibles protégées.

## Niveau 2 — Système actif
Peut évoluer consciemment :
- palette ;
- typographie ;
- radius ;
- spacing ;
- composants ;
- navigation ;
- ordre des sections.

Toute modification doit rester globale et cohérente.

## Niveau 3 — Liberté créative
ChatGPT peut proposer :
- compositions ;
- illustrations ;
- variations de layouts ;
- micro-interactions ;
- manière de mettre en scène les données ;
- éléments éditoriaux.

Cette créativité ne doit jamais enfreindre les niveaux 1 et 2 sans l’indiquer.

---

# 43. Hypothèses vs faits

Chaque nouvelle spécification doit idéalement être classée mentalement comme :

### Fait produit
Déjà réellement implémenté et opérationnel.

### Décision design active
Choix actuellement retenu mais modifiable.

### Hypothèse
À tester.

### Idée future
Non engagée.

### Donnée externe
Information pouvant changer et devant être actualisée.

Exemple :
- « Inter est la police UI » → décision design active.
- « Nidz prend 15 % de commission » → ne pas considérer comme fait.
- « Identité vérifiée » → fait seulement si processus existant.
- nombre de wilayas → donnée externe actualisable.
- disponibilité des moyens de paiement → donnée externe actualisable.

---

# 44. Recherche de référence ayant informé cette source

Cette source s’appuie principalement sur les familles de références suivantes :

### Apple Human Interface Guidelines
Principes utilisés :
- hiérarchie ;
- typographie ;
- couleur ;
- boutons ;
- feedback ;
- motion ;
- accessibilité ;
- taille et confort des cibles tactiles ;
- priorité au contenu et aux interactions compréhensibles.

**Important :** Nidz est une web app. Les HIG sont utilisées comme référence de principes, pas comme obligation de reproduire visuellement iOS.

### W3C — WCAG 2.2
Principes utilisés :
- contraste texte ;
- contraste non textuel ;
- usage non exclusif de la couleur ;
- focus ;
- taille des cibles ;
- redimensionnement ;
- reflow ;
- accessibilité clavier.

### Nielsen Norman Group
Principes utilisés :
- visibilité de l’état du système ;
- correspondance avec le monde réel ;
- contrôle utilisateur ;
- cohérence ;
- prévention des erreurs ;
- reconnaissance plutôt que rappel ;
- réduction de charge cognitive ;
- hiérarchie ;
- Gestalt ;
- chunking.

### Recherches sur la confiance dans les marketplaces / sharing economy
La littérature indique que les informations de réputation et d’identité influencent fortement la confiance perçue dans les plateformes entre pairs. Cela justifie leur présence, mais également la nécessité de ne pas les présenter comme une certitude objective. La réputation doit compléter les informations concrètes, pas les remplacer.

### Documentation shadcn/ui et Tailwind CSS
Les systèmes modernes utilisés par le prototype sont adaptés à une architecture par variables CSS et design tokens sémantiques. Le thème doit donc être centralisé plutôt que dupliqué dans chaque composant.

### Contexte numérique algérien
Les données numériques récentes confirment une forte présence des plateformes sociales et une évolution continue de l’écosystème de paiement électronique. Les choix de canaux, paiements et acquisition restent cependant des hypothèses à tester spécifiquement auprès des utilisateurs Nidz.

---

# 45. Instruction finale pour ChatGPT

Lorsque cette source est présente dans un projet ChatGPT, considérer l’instruction suivante comme permanente :

> **Avant de modifier le design de Nidz, ne cherche pas d’abord à rendre l’écran plus spectaculaire. Cherche à rendre la décision plus facile, la compatibilité plus compréhensible, la confiance plus honnête et l’action suivante plus évidente. Réutilise le design system existant, protège la cohérence sémantique des couleurs et composants, respecte l’accessibilité, puis améliore l’esthétique dans cet espace de contraintes.**
>
> **N’invente jamais une fonctionnalité, une vérification, une réputation, une garantie, une disponibilité, un paiement ou une donnée utilisateur dans le seul but de rendre la maquette plus crédible.**
>
> **Dans Nidz, la sophistication doit être ressentie dans la clarté et la précision, pas dans le nombre d’effets visuels.**

---

# 46. Résumé ultra-court

**Nidz doit sembler calme, humain et fiable.**  
Le produit est centré sur le **matching expliqué** et la **confiance démontrée progressivement**.  
L’interface utilise peu de couleurs, des tokens sémantiques, une forte hiérarchie, beaucoup d’espace utile et des composants cohérents.  
Les profils expliquent concrètement la garde.  
Les signaux de confiance indiquent leur provenance.  
Les fonctionnalités non réellement disponibles ne sont jamais simulées comme si elles étaient opérationnelles.  
Le mobile est prioritaire, l’accessibilité est intégrée et le design doit rester compatible avec React + TypeScript + Vite + Tailwind + shadcn/ui.  
Toute modification future doit améliorer en priorité : **pertinence, confiance, sérénité.**
