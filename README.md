# Eagle_Operator

Plateforme de gestion militaire (missions, soldats, unités, formations) pour Eagle Company.

## Structure du projet

```
Eagle_Operator/
├── assets/
│   ├── css/           # Feuilles de styles (global.css, missions.css, etc.)
│   ├── img/           # Images du site (logo, etc.)
│   └── js/            # Scripts JavaScript modulaires
├── data/              # Données JSON, photos (souvent vides en prod)
├── pages/             # Pages principales du site (missions, soldats, etc.)
├── components/        # (Obsolète, vide ou supprimé)
├── index.html         # Accueil ou dashboard
├── README.md          # Ce fichier
└── ...                # Autres fichiers de config éventuels
```

## Pages principales
- `pages/formations.html` : Gestion des formations
- `pages/missions.html`   : Catalogue et gestion des missions
- `pages/soldats.html`    : Liste et gestion des soldats
- `pages/unites.html`     : Structure des unités

## CSS utilisés
- `global.css` : Style de base commun à toutes les pages
- `missions.css`, `formations.css`, `unites.css` : Styles spécifiques
- `modal-buttons.css`, `notifications.css`, `no-photos.css`, `progression.css`, `dossier-soldat.css` : Styles complémentaires

## JS utilisés (référencés dans les pages)
- `soldierManager.js`, `unitPersonnelManager.js`, `uniteManager.js`, `missionManager.js`, `formationManager.js`, etc.
- `dataManager.js` : gestion centrale des données
- `progressionManager.js`, `sanctionManager.js`, etc. : modules spécialisés

## Bonnes pratiques & conventions
- **Aucun fichier ou dossier inutile** : chaque fichier présent est utilisé dans au moins une page.
- **Modularité** : scripts JS séparés par fonctionnalité, CSS par page ou usage transversal.
- **Pas de dépendances Node.js** : projet 100% statique, facile à déployer sur n'importe quel hébergeur statique.
- **Images et données** : ne garder que l'essentiel, supprimer les dossiers/fichiers vides.

## Instructions de base
- Ouvre les fichiers HTML dans un navigateur pour tester le site.
- Modifie les fichiers CSS/JS dans `assets/` pour personnaliser le style ou la logique.
- Ajoute tes propres données dans `data/` si besoin (format JSON recommandé).

## Pour aller plus loin
- Fusionner les modules JS si besoin pour simplifier encore plus.
- Enrichir la documentation selon l'évolution du projet.
- Ajouter des tests ou une CI/CD si le projet devient plus complexe.

---

Projet nettoyé et harmonisé par IA (Cascade) – prêt pour la maintenance ou l’évolution !
