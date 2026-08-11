# Audit 1.1 (correction CHATGPT)

## Audit de l’application : ce qu’il faut ajouter / modifier

### Général

- remplacer toutes les anciennes références de **PetLink DZ** par **NIDZ** dans le code
- remplacer les pages et textes **“coming soon”** visibles dans le parcours de démonstration
- ne garder accessibles pendant la démo que les écrans réellement utilisables
- masquer **Admin** de la navigation publique
- utiliser **Inter** comme police principale de toute l’application
- utiliser **Playfair Display** seulement éventuellement pour un grand titre marketing
- supprimer les gradients décoratifs actuels
- supprimer les grosses ombres et effets de zoom au survol inutiles
- garder une seule action principale visuellement dominante par écran
- utiliser uniquement les icônes **Lucide** dans l’interface
- ne pas utiliser les emojis comme système d’icônes
- design mobile-first
- boutons importants d’environ **44 px minimum**
- animations courtes et discrètes
- conserver l’architecture multilingue existante et éviter les textes hardcodés
- ajouter un bouton retour sur les écrans secondaires uniquement, en haut à gauche
- ne pas ajouter de bouton retour sur l’accueil ou les écrans racine

### Code couleur

| Zone | Couleur | HEX | Rôle | Utilisation |
| --- | --- | --- | --- | --- |
| 🧬 NIDZ — principale | Deep Teal | `#0F766E` | identité + action principale | logo, CTA principal, navigation active, sélection |
| NIDZ — hover | Dark Teal | `#115E59` | interaction | hover / pressed des boutons principaux |
| NIDZ — fond doux | Soft Teal | `#E7F3F1` | mise en valeur légère | sélection, tags sobres, éléments liés au primaire |
| 🧡 NIDZ — accent | Warm Terracotta | `#A84F32` | chaleur humaine | détails de marque, illustrations, accent rare |
| NIDZ — accent doux | Soft Terracotta | `#F7EAE4` | chaleur légère | fonds décoratifs ponctuels |
| 🤍 Fond principal | Warm Off-White | `#FBFAF7` | fond général | application propriétaire et pet-sitter |
| 🤍 Cards / surfaces | White | `#FFFFFF` | contenu | cartes, formulaires, modales, panneaux |
| 🖤 Texte principal | Dark Green Slate | `#18211F` | lecture principale | titres, noms, prix, textes importants |
| 🩶 Texte secondaire | Muted Slate | `#5B6864` | hiérarchie secondaire | dates, localisation, aide, métadonnées |
| 🧱 Bordures | Light Gray-Green | `#DCE3E0` | séparation | cartes, séparateurs, tableaux |
| Champs / contrôles | Medium Gray-Green | `#7C8B86` | visibilité fonctionnelle | contours des inputs, select, contrôles |
| ✅ Succès | Green | `#166534` | confirmation | demande acceptée, opération réussie |
| ⚠️ Warning | Amber | `#9A5700` | attention | information manquante, action à vérifier |
| 🚨 Erreur / Danger | Red | `#B91C1C` | erreur / destruction | erreurs, suppression, action dangereuse |
| ℹ️ Information | Blue | `#1D4ED8` | information distincte | messages informatifs nécessitant une couleur |
| ⏳ En attente | Teal Soft + texte | `#E7F3F1` + `#0F766E` | état non terminé | demande en attente, validation en attente |

---

# Ouverture de NIDZ — nouvel utilisateur

### Écran 1 — chargement

- logo **NIDZ** au milieu de l’écran
- fond `#FBFAF7`
- animation très légère
- écran très court
- ne pas retarder artificiellement l’entrée dans l’application

### Écran 2 — introduction

**Trouvez une personne de confiance pour prendre soin de votre animal.**

petite description de NIDZ

en bas :

**( Commencer )**

bouton plus discret :

**J’ai déjà un compte**

### Écran 3 — intention

**Que souhaitez-vous faire aujourd’hui ?**

**Trouver quelqu’un pour mon animal**

petite description

**Garder des animaux**

petite description

- ce choix ne crée pas deux comptes différents
- l’utilisateur pourra plus tard utiliser les deux côtés de NIDZ

---

# PROPRIÉTAIRE

## Définir le besoin avant d’afficher les résultats

### Pour quel animal cherchez-vous une garde ?

- chien
- chat
- ne pas ajouter oiseaux / autres espèces dans la V1 de démonstration

### Votre animal

- nom
- espèce
- âge
- photo facultative
- besoins ou contraintes importantes

### Où cherchez-vous ?

- Wilaya
- commune
- ou utiliser ma position

petit texte :

**Votre adresse exacte ne sera pas affichée publiquement.**

### Quand avez-vous besoin d’une garde ?

- date de début
- date de fin

### Quel type de garde recherchez-vous ?

- garde chez le pet-sitter
- garde au domicile du propriétaire
- promenade

**( Voir les pet-sitters )**

---

# Résultats propriétaire

remplacer :

**Pet-sitters les mieux notés**

par :

**Pet-sitters adaptés à votre recherche**

### Bouton filtrer

apparition de :

- distance
- prix
- animaux
- type de garde
- disponibilité

### Carte pet-sitter

exemple :

**Karim A.**

1,2 km

4,9 · 18 avis 

**Disponible du 12 au 16 août**

**Accepte les chiens**

**Accepte les chats**

500 DA / nuit

**( Voir le profil )**

- enlever le bouton **Contacter**
- ne pas afficher plusieurs CTA sur la carte
- **Identité vérifiée** (si le pet sitter est vraiment vérifié)

---

# Profil pet-sitter vu par le propriétaire

L’utilisateur ouvre Karim.

Il voit :

- photo
- prénom
- localisation approximative
- courte présentation
- raisons de compatibilité avec son animal
- signaux de confiance réellement disponibles
- expérience
- services proposés
- animaux acceptés
- tailles d’animaux acceptées
- type de logement
- espace extérieur si disponible
- animaux présents au domicile
- manière dont les animaux sont gardés
- situations ou animaux que le pet-sitter refuse
- disponibilités
- tarifs
- avis uniquement si réellement disponibles ou clairement identifiés comme données de démonstration

pour les informations déclarées par le pet-sitter :

**Informations fournies par le pet-sitter**

ensuite gros CTA fixe en bas :

**( Demander une garde )**

---

# Création du compte propriétaire

demander la création du compte seulement lorsque l’utilisateur veut envoyer sa demande

### Comment vous appelez-vous ?

- prénom
- nom

**( Continuer )**

### Numéro de téléphone

`+213 _ _ _ _ _ _ _ _ _`

sélecteur :

- +213
- autres pays si réellement nécessaires

**( Continuer )**

### Vérification du numéro

- code OTP
- champ code
- renvoyer le code
- modifier le numéro
- si le système OTP n’est pas réellement connecté, indiquer clairement qu’il s’agit d’une simulation de démonstration

---

# Confirmation de la demande

avant l’envoi afficher un résumé :

- pet-sitter choisi
- animal
- type de garde
- dates
- localisation
- besoins importants de l’animal
- tarif affiché si applicable

**( Envoyer ma demande )**

- utiliser **Envoyer une demande**
- ne pas utiliser **Réserver**
- ne pas utiliser **Payer**

---

# Succès

grande animation de validation courte

**Votre demande a été envoyée**

Karim peut maintenant consulter votre demande pour Luza.

**12–16 août**

**En attente de réponse**

**( Voir ma demande )**

**( Retour à l’accueil )**

- si l’envoi est seulement simulé : afficher **Demande de démonstration envoyée**

---

# Mes demandes

ajouter un écran simple :

**Mes demandes**

chaque demande affiche :

- pet-sitter
- animal
- dates
- type de garde
- statut

statuts :

- En attente
- Acceptée
- Refusée
- Terminée uniquement si ce cycle existe réellement

---

# PET-SITTER

## Écran d’introduction

**Faites de votre passion pour les animaux une activité rémunérée.**

Créez votre profil, indiquez comment vous pouvez garder les animaux et commencez à recevoir des demandes adaptées près de chez vous.

**( Créer mon profil )**

---

# Identité

### Comment vous appelez-vous ?

- prénom
- nom

**( Continuer )**

### Numéro de téléphone

`+213 _ _ _ _ _ _ _ _ _`

sélecteur pays

**( Continuer )**

### Vérification du numéro

- code OTP
- renvoyer le code
- modifier le numéro

---

# Localisation

### Où proposez-vous vos services ?

- Wilaya
- commune
- utiliser ma position

petit texte :

**Votre adresse exacte ne sera pas affichée publiquement.**

---

# Création du profil

ajouter un indicateur de progression discret en haut

ne pas écrire obligatoirement :

**Étape 4 sur 7**

### Votre photo

↓

### Votre expérience

questions concrètes :

- depuis combien de temps gardez-vous des animaux ?
- avec quels animaux avez-vous le plus d’expérience ?
- expérience professionnelle liée aux animaux si applicable

↓

### Services proposés

- garde chez moi
- garde chez le propriétaire
- promenade

↓

### Animaux acceptés

- chiens
- chats
- nombre maximum d’animaux

↓

### Votre logement

- appartement
- maison
- espace extérieur
- jardin si applicable
- autres animaux présents au domicile
- conditions importantes du logement

↓

### Comment les animaux seront-ils gardés ?

- libres dans le logement
- zones séparées si nécessaire
- accès extérieur
- conditions particulières
- utilisation d’une cage uniquement si réellement applicable et clairement expliquée

↓

### Vos limites

- animaux ou situations que vous ne pouvez pas accepter
- incompatibilités avec les animaux présents
- autres contraintes importantes

↓

### Disponibilités

- calendrier simple
- jours disponibles
- périodes indisponibles

↓

### Tarifs

- tarif selon le service
- unité clairement affichée : nuit / jour / visite / promenade

---

# Confiance & identité

### Pièce d’identité

petit texte expliquant pourquoi NIDZ demande cette information

**( Ajouter ma pièce d’identité )**

- l’envoi d’une pièce d’identité ne signifie pas que l’identité est vérifiée
- afficher **Vérification en attente** tant qu’un véritable contrôle n’a pas eu lieu
- ne jamais transformer automatiquement l’upload en badge **Identité vérifiée**

---

# Aperçu du profil

**Voici ce que les propriétaires verront**

afficher exactement le même profil que côté propriétaire

distinguer :

- informations fournies par le pet-sitter
- informations réellement vérifiées par NIDZ
- avis
- données observées par la plateforme

**( Modifier mon profil )**

**( Publier mon profil )**

---

# Après publication du profil pet-sitter

### Écran

**Votre profil est publié**

petit texte expliquant ce qui se passe ensuite

**( Voir mon profil )**

**( Voir mes demandes )**

---

# Demandes reçues — pet-sitter

ajouter cet écran pour compléter la démonstration marketplace

### Nouvelle demande

**Luza**

chat

garde du 12 au 16 août

type de garde

localisation approximative

besoins importants de Luza

informations nécessaires pour prendre une décision

**( Accepter la demande )**

bouton secondaire :

**Refuser**

---

# Après acceptation

**Demande acceptée**

le propriétaire voit également le nouveau statut dans **Mes demandes**

- ne pas annoncer une réservation définitive si NIDZ ne gère pas encore réellement les réservations
- ne pas annoncer un paiement
- ne pas annoncer une protection ou assurance

---

# Navigation mobile propriétaire

barre inférieure simple :

- Accueil
- Demandes
- Messages uniquement si l’écran existe réellement
- Mes animaux
- Profil

---

# Navigation mobile pet-sitter

- Demandes
- Disponibilités
- Messages uniquement si l’écran existe réellement
- Mon profil
- Compte

---

# États indispensables pour la démo

prévoir au minimum :

- chargement
- aucun résultat
- erreur
- demande en attente
- demande acceptée
- aucune demande reçue

exemple :

**Aucun pet-sitter disponible pour ces critères**

**Essayez d’élargir la distance ou de modifier les dates.**

---