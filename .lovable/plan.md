# Intégration complète du design Figma

## Objectif

Remplacer toute l’apparence actuelle par le frontend fourni dans l’archive, sur les pages client et le tableau de bord, tout en conservant les fonctions réelles déjà en place : réservation, disponibilités, urgence, liens privés, liste d’attente, connexion, gestion des interventions, projets, emails et réglages.

## Ce qui sera appliqué

- Reprendre fidèlement le système visuel Figma : palette marine/cyan/cuivre, typographies Fraunces/Outfit/JetBrains Mono, surfaces, formulaires, boutons, animations et navigation.
- Importer les deux images fournies dans l’archive et conserver leur cadrage prévu.
- Reproduire toutes les pages client : accueil, réservation, urgence, offre, accès et report de rendez-vous.
- Reproduire toutes les pages propriétaire : connexion, aperçu, interventions, détail d’intervention, calendrier, liste d’attente, prospects, projets, détail de projet, boîte de réception, ROT et réglages.
- Garder les adaptations mobile et ordinateur prévues par Figma, notamment la navigation mobile du tableau de bord et les actions persistantes des formulaires.

## Conservation du fonctionnement actuel

- Les écrans Figma utilisent des données de démonstration ; ils seront reliés aux services et données réels du projet au lieu de remplacer le fonctionnement existant.
- Les disponibilités continueront d’afficher uniquement les créneaux réellement libres, y compris le soir selon les horaires configurés.
- Les offres resteront limitées dans le temps et sécurisées par leur lien privé.
- Les actions du propriétaire conserveront la connexion sécurisée et les autorisations existantes.
- Les confirmations par email, les photos, les exports ROT et le mode horloge de démonstration resteront fonctionnels.

## Adaptations techniques nécessaires

- Adapter uniquement la navigation Figma au système de navigation déjà utilisé par l’application ; l’apparence ne changera pas.
- Convertir les couleurs intégrées dans les pages en variables visuelles globales équivalentes, afin d’obtenir exactement le même rendu sans casser les thèmes ou l’accessibilité.
- Remplacer les boutons purement démonstratifs par les actions réelles déjà présentes.
- Conserver les métadonnées propres à chaque page et le comportement de réduction des animations.
- Retirer uniquement les données fictives et les liens d’images externes lorsqu’une ressource locale est nécessaire ; aucun faux contenu ne remplacera les données réelles.

## Vérification

- Contrôler chaque page en grand écran et sur mobile.
- Tester le parcours complet de réservation avec un vrai créneau disponible.
- Tester les pages privées par lien, le parcours d’urgence et les actions principales du tableau de bord avec une session propriétaire.
- Vérifier l’absence de débordement, de texte superposé, d’erreur visible et d’erreur de compilation.