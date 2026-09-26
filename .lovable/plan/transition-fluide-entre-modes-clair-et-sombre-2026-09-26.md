# Transition fluide entre modes clair et sombre

## Objectif
Rendre le changement de thème visuellement élégant et instantané, sans ralentir le reste de l’interface.

## Changements
- Utiliser une transition circulaire native qui part du bouton soleil/lune et révèle le nouveau thème.
- Animer brièvement l’icône du thème pour rendre l’action claire.
- Remplacer les transitions appliquées à de nombreux éléments par une transition globale accélérée, afin d’éviter les saccades.
- Garder un changement immédiat sur les navigateurs sans support et lorsque la réduction des animations est activée.
- Conserver le thème choisi après navigation et rechargement.

## Vérification
- Tester clair → sombre → clair depuis l’accueil et le tableau de bord.
- Vérifier la fluidité, la persistance après rechargement et l’absence de décalage visuel.
- Vérifier le comportement mobile et le dernier état du projet.
