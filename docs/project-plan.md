# StudioFlow — Project Plan

## Équipe et répartition des tâches

Découpage par feature verticale, alignée sur les tables de la base de
données. Chaque personne garde sa vertical de bout en bout, du front-end
(Milestone 2) au back-end (Milestone 3), pour une attribution claire du
travail entre les 3 membres.

| Personne | Vertical | Périmètre | Tables |
|---|---|---|---|
| **Raphaël** | Auth & Team | Inscription/connexion, session par token, connexion Google, gestion des membres et rôles | `users`, `accounts`, `refresh_tokens`, `project_members` |
| **Théodore** | Boards & Tasks | Kanban (colonnes To Do/Doing/Done), détail tâche, commentaires | `tasks`, `comments` |
| **Guillaume** | Projects & Deliverables | Dashboard des projets, vue deliverable (stepper de production, assets) | `projects`, `deliverables`, `assets` |

*Répartition Théodore/Guillaume à confirmer entre eux — les deux verticals
sont interchangeables.*

## Calendrier

À confirmer avec les dates officielles du cours si elles diffèrent.

| Étape | Date cible | Contenu |
|---|---|---|
| Milestone 1 | 5 oct. 2026 | Problem statement, ERD, maquettes, plan de projet |
| Front-end — auth & squelette app | 19 oct. 2026 | Layout Vue.js, routing, écrans statiques |
| Front-end — intégration des 3 verticals | 2 nov. 2026 | Composants dynamiques par vertical |
| **Milestone 2** | **9 nov. 2026** | Front-end complet sur GitHub |
| Back-end — API + DB par vertical | 30 nov. 2026 | Routes Node.js, requêtes MySQL par vertical |
| Intégration front/back + tests | 7 déc. 2026 | Connexion complète, corrections de bugs |
| **Milestone 3** | **14 déc. 2026** | Back-end complet, présentation (5–7 min) |

## Notes

- Auth & Team est la vertical la plus complexe (sécurité, tokens, OAuth) et
  bloque les deux autres pour les tests end-to-end — à démarrer en premier.
- Le stage courant d'un deliverable (vu dans les maquettes) est calculé à
  partir des tâches, pas stocké — dépendance légère entre Boards & Tasks et
  Projects & Deliverables à garder en tête à l'intégration.
