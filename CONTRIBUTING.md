# Contributing Guide — StudioFlow

This guide is maintained with the help of Claude Code, which also drives the
day-to-day development workflow on this repo — scaffolding, implementation,
and git operations are done through Claude Code, with the conventions below
enforced on every step (branch naming, commit format, no direct push to
`main`) so development stays consistent and these guidelines are actually
respected rather than drifting over time.

This repository also serves as proof of participation for grading. Each member
must commit **from their own GitHub account** — no squashed commits under a
single account, no co-authoring that would hide who did what.

## Branching convention

- `main`: always working branch. **Never push directly.** Every change goes
  through a Pull Request.
- `feat/<short-name>`: new feature
- `fix/<short-name>`: bug fix
- `docs/<short-name>`: documentation only

One branch = one task. Examples: `feat/auth-token`, `fix/pipeline-status`,
`docs/readme-install`.

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

## Workflow: branch → PR → review → merge

1. Create your branch from an up-to-date `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/my-task
   ```
2. Commit regularly, with clear messages following the convention above.
3. Push the branch and open a Pull Request against `main`, filling in the PR
   template (description, relevant milestone, checklist).
4. **Have another team member review the PR** before merging. No auto-merge
   without review, even for a small task.
5. Once the review is approved and feedback addressed, merge the PR (merge or
   squash, team's preference) then delete the branch.

## Issues

Every identified task must have an issue created via the `Task` template
(`.github/ISSUE_TEMPLATE/task.md`), with acceptance criteria and an assigned
member, linked to the relevant milestone.
