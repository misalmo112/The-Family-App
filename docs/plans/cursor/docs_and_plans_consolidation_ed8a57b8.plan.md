---
name: Docs and plans consolidation
overview: Create a repo-root `docs/` documentation hub and consolidate all Cursor-generated plan files into `docs/plans/` for long-term reference.
todos:
  - id: add-docs-root-index
    content: Create `docs/README.md` as the documentation entry point and link to existing top-level docs + plans index.
    status: in_progress
  - id: add-plans-area
    content: Create `docs/plans/PLAN.md` (master plan) and `docs/plans/README.md` (index).
    status: pending
  - id: copy-cursor-plans
    content: Create `docs/plans/cursor/` and copy all files from `C:\Users\misal\.cursor\plans\*.plan.md` into it.
    status: pending
  - id: generate-plans-index-links
    content: Populate `docs/plans/README.md` with links to every copied plan file.
    status: pending
---

# Docs + plan files consolidation

## Goal

- Add a single documentation entry point inside the repo (`docs/README.md`).
- Create a plans area under it (`docs/plans/`) with:
- a simple “master” plan file
- an index that links to all historical plan files
- copies of all Cursor-generated plan files currently stored outside the repo.

## What I found

- Your Cursor plan files live outside the repo at `C:\Users\misal\.cursor\plans\` (e.g. `relationship_resolver_implementation_1f94f060.plan.md`, etc.).
- I did not find any `*plan*.md` files already inside the git repo.

## Proposed structure (new)

- `docs/README.md` (root documentation file)
- links to repo docs you already have: `README.md`, `CODE_STRUCTURE.md`
- links to `docs/plans/README.md`
- `docs/plans/PLAN.md` (the “plan file” under docs)
- short, current-high-level plan and pointers to sub-plans
- `docs/plans/README.md` (plans index)
- links to:
  - `docs/plans/PLAN.md`
  - all copied Cursor plans
- `docs/plans/cursor/` (archived historical plans)
- copies of all files from `C:\Users\misal\.cursor\plans\*.plan.md`

## Implementation approach

- Create folders: `docs/`, `docs/plans/`, `docs/plans/cursor/`.
- Copy the Cursor plan files into the repo (copy, not move), so Cursor keeps functioning normally.
- PowerShell copy command:
  - `Copy-Item "C:\Users\misal\.cursor\plans\*.plan.md" -Destination "docs\plans\cursor\" -Force`
- Generate `docs/plans/README.md` with a bulleted list of markdown links to each plan file under `docs/plans/cursor/`.
- Write `docs/README.md` as the root index and keep it stable so you can link to it from anywhere.

## Notes / constraints

- This will add ~30 plan markdown files to the repo. If you’d prefer fewer, we can later prune or move older plans to a separate archive branch/tag—but this plan follows your request to consolidate all of them.