# Contributing Guide — StudioFlow

The AI tools we used are listed in the [Tools](README.md#tools) section of the README.

This repository also serves as proof of participation for grading. Each member
must commit **from their own GitHub account** — no squashed commits under a
single account, no co-authoring that would hide who did what.

## Branches

- `main`: the shared branch, kept working (back-end tests pass, front-end
  builds). Commits go directly on `main`; a Pull Request is **not required**.
- A separate branch is optional, for a larger or risky change you want to
  share before it lands. Name it `feat/<short-name>`, `fix/<short-name>` or
  `docs/<short-name>` (e.g. `feat/auth-token`, `fix/pipeline-status`).

## Commit convention

We follow [Conventional Commits](https://www.conventionalcommits.org/), with
messages **in English**.

Types used:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` technical task (config, dependencies, cleanup...)

Rules:

- Subject line under 72 characters
- Imperative subject, in English (e.g. `feat: add token-based authentication`)
- The commit body (optional) explains why, not how

### Enabling the commit template

A template is provided in `.gitmessage` at the repo root. To enable it on your
machine:

```bash
git config commit.template .gitmessage
```

This command only affects your local configuration; everyone needs to run it
once on their own machine.

## Workflow: commit on `main`

1. Start from an up-to-date `main`:
   ```bash
   git checkout main
   git pull
   ```
2. Make one commit per task, with a message following the convention above.
3. Before pushing a code change, check that nothing is broken:
   ```bash
   cd backend && npm test   # uses its own test database, the demo data is left alone
   cd ../frontend && npm run build
   ```
4. Re-read your commits (`git log -p origin/main..`), then `git push`.

If you used an optional branch, you can open a Pull Request with the template
(`.github/pull_request_template.md`) to get a review, or merge it into `main`
yourself once it is up to date.

## Issues

Every identified task must have an issue created via the `Task` template
(`.github/ISSUE_TEMPLATE/task.md`), with acceptance criteria and an assigned
member, linked to the relevant milestone.
