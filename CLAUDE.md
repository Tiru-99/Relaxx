@AGENTS.md

# Claude-specific workflow

AGENTS.md (imported above) is the source of truth for architecture, layers and conventions.
This section only adds how to *work* in this repo.

## Before writing code

- Read the files you will touch, plus one similar existing file, and match its style.
- For anything bigger than a small fix, decide first **which layer** each new piece belongs to
  (AGENTS.md §5) and **where each type/helper lives** (AGENTS.md §6). If a change would break a layer
  rule, stop and propose a design instead of working around it.
- Prefer editing existing files to creating new ones. Create a new file, folder or layer only when
  AGENTS.md's trigger condition is actually met.

## While writing code

- Keep every file under 500 lines (aim for under ~250). If an edit would push a file past the limit, split it by
  responsibility in the same change.
- Make the smallest change that fully solves the task. Don't refactor unrelated code, rename things
  without being asked, or add speculative options or abstractions.
- Comments explain *why*, not *what*. Match the comment density of the surrounding code.
- When you promote a type or helper to `types/` or `utils/`, move it and update every import. Never duplicate it.

## Before saying you're done

1. Run `npm run lint && npm run typecheck && npm run build` and fix every failure. Don't silence rules.
2. For UI changes, open the page in the browser (light and dark, desktop and ~360px wide) and check it.
3. Check the change against the calm design rules (AGENTS.md §13).
4. Report what changed, what you verified, and anything you could not verify. Be honest about failures.

## Ask before

- Adding a dependency, a new top-level folder/layer, or an API route.
- Editing anything in `public/games/**`.
- Deleting files or changing the public URL of a page.
