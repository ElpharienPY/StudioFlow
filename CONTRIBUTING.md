# Guide de contribution — StudioFlow

Ce dépôt sert aussi de preuve de participation pour la notation du projet.
Chaque membre doit committer **depuis son propre compte GitHub** — pas de
commits groupés sous un seul compte, pas de co-écriture qui masquerait qui a
fait quoi.

## Convention de branches

- `main` : branche toujours fonctionnelle. **Jamais de push direct.**
  Toute modification passe par une Pull Request.
- `feat/<nom-court>` : nouvelle fonctionnalité
- `fix/<nom-court>` : correction de bug
- `docs/<nom-court>` : documentation uniquement

Une branche = une tâche. Exemples : `feat/auth-token`, `fix/pipeline-status`,
`docs/readme-install`.

## Convention de commits

On suit [Conventional Commits](https://www.conventionalcommits.org/), avec des
messages **en français**.

Types utilisés :

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `chore:` tâche technique (config, dépendances, nettoyage...)

Règles :

- Ligne de sujet sous 72 caractères
- Sujet à l'impératif, en français (ex : `feat: ajoute l'authentification par token`)
- Le corps du message (optionnel) explique le pourquoi, pas le comment

### Activer le gabarit de commit

Un gabarit est fourni dans `.gitmessage` à la racine du dépôt. Pour l'activer
sur votre poste :

```bash
git config commit.template .gitmessage
```

Cette commande n'affecte que votre configuration locale ; chacun doit l'exécuter
une fois sur sa propre machine.

## Workflow : branche → PR → review → merge

1. Créer sa branche depuis `main` à jour :
   ```bash
   git checkout main
   git pull
   git checkout -b feat/ma-tache
   ```
2. Committer régulièrement, avec des messages clairs suivant la convention
   ci-dessus.
3. Pousser la branche et ouvrir une Pull Request vers `main`, en remplissant
   le template de PR (description, milestone concerné, checklist).
4. **Faire relire la PR par un autre membre de l'équipe** avant fusion. Pas
   d'auto-merge sans review, même pour une petite tâche.
5. Une fois la review approuvée et les retours traités, fusionner la PR
   (merge ou squash selon préférence de l'équipe) puis supprimer la branche.

## Issues

Chaque tâche identifiée doit avoir une issue créée via le template
`Tâche` (`.github/ISSUE_TEMPLATE/tache.md`), avec critères d'acceptation
et membre assigné, rattachée au milestone concerné.
