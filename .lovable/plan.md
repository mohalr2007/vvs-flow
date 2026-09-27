# Restaurer uniquement l’ancien calendrier

## Objectif
Remplacer seulement l’apparence du calendrier Figma actuel par l’ancien calendrier jugé plus réussi, sans modifier les autres pages du site.

## Modifications
- Reprendre la grille jour/semaine, l’en-tête, les commandes précédent/aujourd’hui/suivant et la légende de l’ancien calendrier.
- Conserver les rendez-vous, tâches de projet, jours de repos, horaires, navigation vers les fiches et ligne de l’heure actuelle provenant des vraies données.
- Garder le calendrier dans le tableau de bord actuel afin que le menu et les autres pages restent inchangés.
- Vérifier les vues ordinateur et mobile, les modes jour/semaine, la navigation des dates et les erreurs visuelles.

## Détails techniques
- La page `/dashboard/calendar` continuera d’utiliser le service calendrier existant.
- Seul le code de présentation du calendrier sera remplacé; aucune fonction métier ni donnée ne sera modifiée.
