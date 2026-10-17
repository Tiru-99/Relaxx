# AGENTS.md

Operating manual for AI coding agents (and humans) working in this repo. Read it fully before your
first change. When this file conflicts with your defaults, this file wins.

---

## 1. Project

**Still Grove** is a calm, nature-themed website that hosts slow, soothing browser games.
Stack: **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS v4**.
Every product and design decision serves one feeling: *calm*.

## 2. Commands

| Task             | Command                                |
| ---------------- | -------------------------------------- |
| Install          | `npm install`                          |
| Dev server       | `npm run dev` → http://localhost:3000  |
| Production build | `npm run build`                        |
| Lint             | `npm run lint`                         |
| Type check       | `npm run typecheck`                    |

**Definition of done:** `npm run lint && npm run typecheck && npm run build` all pass, and you have
checked the change in the browser if it touches UI.

---

## 3. Engineering principles

Write code like a senior engineer who has to maintain it for years:

1. **Simple beats clever.** Use the most direct solution that is correct. Readable code is more important than short code.
2. **YAGNI: structure is earned, not added up front.** Don't create a folder, layer, abstraction,
   generic helper or config option until real code needs it. Three similar lines are better than a
   premature abstraction. Every rule below that says "move X to Y" applies **only once the trigger
   condition is actually met**.
3. **Locality first.** Code lives next to the code that uses it. Promote it to a shared location only
   when a second or third consumer appears.
4. **One responsibility per file.** If you need the word "and" to describe a file, split it.
5. **Explicit over implicit.** Use explicit types at module boundaries, explicit return types on exported
   functions, and no hidden side effects on import.
6. **Leave it cleaner.** Fix what you touch, but don't refactor unrelated code in the same change.

---

## 4. File size limit: 500 lines max

- **No source file (`.ts`, `.tsx`, `.css`) may exceed 500 lines.** Long Tailwind class lists count, so extract a component when JSX gets dense. Aim for under ~250. A file
  heading past 300 lines is a signal to look for a split.
- When a file approaches the limit, split by **responsibility**, not by line count:
  - A component with sub-sections → extract child components into the same `components/<domain>/` folder.
  - Large logic inside a component → move it into a `useSomething` hook or a pure function.
  - Long static data (lists, configs) → move it into its own `*.data.ts` file.
  - A mixed module → separate the pure logic from the side-effecting code.
- Never "split" by cutting a file into `part1` / `part2`. Each new file must have a clear single purpose and a clear name.
- Exempt: vendored game builds in `public/games/**` and generated files.

---

## 5. Architecture: layers

We use the flat `src/` layout common in open-source Next.js projects (shadcn/ui's taxonomy, Vercel
Commerce, create-t3-app): **layers are top-level folders, and domains are subfolders inside them.**
There is no `features/` folder.

Each layer has one job and may only depend on the layers **below** it. A layer never imports from a
layer above it.

```
 ┌──────────────────────────────────────────────────────────────┐
 │ app/          Routing: pages, layouts, route handlers        │  ← top
 ├──────────────────────────────────────────────────────────────┤
 │ components/   UI, grouped by domain                          │
 │ hooks/        Shared client-side React hooks                 │
 ├──────────────────────────────────────────────────────────────┤
 │ services/     Server-only data access (DB calls)             │  (API path)
 ├──────────────────────────────────────────────────────────────┤
 │ lib/          Infrastructure, integrations, app-wide config  │
 ├──────────────────────────────────────────────────────────────┤
 │ utils/        Pure, stateless helper functions               │
 │ types/        Shared type definitions                        │  ← bottom
 └──────────────────────────────────────────────────────────────┘
```

### Folder layout

Folders marked *(when needed)* don't exist yet. Create them only when the first real code for them
arrives. Don't scaffold empty folders.

```
public/games/<slug>/index.html    Self-contained game builds (vendored, never imported)
src/
  app/                            Routing layer only
    layout.tsx, page.tsx, ...     Pages compose components, with little logic
    api/<resource>/route.ts       (when needed) HTTP route handlers
  components/
    ui/                           Generic building blocks with no domain knowledge (AmbientSky, later Button, ...)
    layout/                       Site shell and page scaffolding (SiteHeader, SiteFooter, PageSection)
    games/                        Game-specific UI (GameCard, GameGrid, GameFrame)
    <domain>/                     (when needed) One subfolder per domain, e.g. daily-world/
  hooks/                          (when needed) Hooks used by 2+ components
  services/                       (when needed) Server-only DB/storage calls, one file per resource
  lib/                            Infrastructure and app-wide config: games registry, API client, env, audio engine
  utils/                          (when needed) Pure helpers shared across 3+ modules
  types/                          Types shared across 3+ modules (game.ts)
```

Start a new `components/<domain>/` subfolder only once a domain has 2+ components. Until then, a
single component goes in the closest existing folder.

### Layer rules

| Layer                | Responsibility | May import from | Must NOT |
| -------------------- | -------------- | --------------- | -------- |
| `app/`               | Routing, metadata, composing pages, HTTP handlers | everything below | contain business logic or reusable UI |
| `components/<domain>/` | UI for one domain | `components/ui`, `components/layout`, `hooks`, `lib`, `utils`, `types` | import another domain's components (if two domains need it, move it to `ui/`) |
| `components/ui/`     | Generic, reusable presentational UI | `utils`, `types` | know about any domain (games, players, ...), fetch data, or import other `components/` folders |
| `hooks/`             | Shared client-side stateful logic | `lib`, `utils`, `types` | render UI or import from `components/` or `services/` |
| `services/`          | Data access only: DB, KV, file or third-party storage calls | `lib`, `utils`, `types` | contain business rules, import React, components or hooks, or run in the browser |
| `lib/`               | Wrappers around external things (fetch, env, storage, audio, SDKs) and app-wide config/registries (`games.ts`) | `utils`, `types` | import from `components/`, `hooks/`, `services/`, `app/` |
| `utils/`             | Pure functions: input → output, no I/O, no state | `types` only | touch the DOM, network, storage, `Date.now()`/randomness without injection |
| `types/`             | Type-only declarations | nothing (other types only) | contain runtime code |

**`lib/` vs `utils/`:** if it talks to the outside world, holds configuration, or wraps a library,
it goes in `lib/`. If it is a pure function you could unit-test with no mocks, it goes in `utils/`.

---

## 6. Where does this type or function go?

Follow this decision tree, in order:

1. **Used in one file?** Keep it **in that file**, unexported, near where it's used.
2. **Used by several files in one domain folder?** Put it next to them in that folder, e.g.
   `components/games/games.types.ts`.
3. **Used in 3 or more places across different modules?** Promote it to `src/types/` or
   `src/utils/` (or `src/lib/` if it has side effects), with a descriptive filename
   (`types/game.ts`, `utils/format-duration.ts`). Never use `types/index.ts` or `utils/helpers.ts` grab-bags.
4. **Only 2 users across modules?** Keep it with its owner and import it from there. Promote it when the third consumer appears.

When you promote something, **move it** and update all imports. Never leave a duplicate copy behind.
If a "shared" helper ends up used by only one module again, move it back.

---

## 7. API & data flow

Only add this when the site genuinely needs server data (accounts, the daily world seed, shared
lantern counts, ...). Static content like the game registry stays a plain TS module.

### Server side: two layers, kept simple

```
app/api/<resource>/route.ts   →   services/<resource>.service.ts
   (HTTP + logic)                    (DB calls only)
```

- **Route handler (`app/api/<resource>/route.ts`):** owns the request. Parse and validate input,
  apply the rules for that endpoint, call service functions for any data, and return a `Response`
  with the right status code. Next.js only treats files named `route.ts` as endpoints, so don't use `index.ts`.
- **Service (`services/<resource>.service.ts`):** the *only* code that talks to a database, KV store,
  file system or third-party storage. Small, typed functions (`getLanternCount()`, `addLantern(input)`)
  that return domain types, not raw driver rows. There are no business rules here and no `Request`/`Response`.
- Every file in `services/` starts with `import "server-only";`.
- If a route's logic outgrows the 500-line limit, or the same logic is needed by a second route, a Server
  Component or a Server Action, extract it into a helper file next to the route
  (`app/api/<resource>/<resource>.logic.ts`). Don't add a new top-level layer for it.
- Server Components that only read data call services directly. Don't call your own `/api` routes from the server.
- Server Actions (`"use server"`) follow the same rules as route handlers.

### Client side

- All browser → API calls go through a single typed client in `src/lib/api-client.ts`. Components
  and hooks never call `fetch` with hand-built URLs.
- Request/response shapes shared by client and server live in `src/types/api/<resource>.ts`. This is
  the only coupling between the two sides.
- Errors cross boundaries as typed results (`{ ok: true, data } | { ok: false, error }`), never as
  thrown strings. Show the user calm, human messages. Never show raw errors.

---

## 8. React & Next.js conventions

- **Server Components by default.** Add `"use client"` only for state, effects, refs, event handlers
  or browser APIs. Push the client boundary as far down the tree as possible, so client components stay small leaves.
- **Next.js 16:** route `params`/`searchParams` are Promises, so `await` them. Use `next/link`,
  `next/font`, `next/image` and the `Metadata` API.
- **Components:** one exported component per file, named like the file (`GameCard.tsx` → `GameCard`).
  Props are typed with a local `type Props`. Use named exports, not default exports, except where Next requires a default (pages, layouts).
- **Hooks:** start with `use` and do one thing each. A hook used by one component stays in that component's file
  (or next to it). Move it to `src/hooks/` once 2+ components use it.
- **Games** run in `<GameFrame>` (an iframe) on purpose, so their globals, canvas and AudioContext stay
  isolated. Never import game code into React.

## 9. TypeScript

- `strict` is on. No `any`. Use `unknown` and narrow it. No `@ts-ignore`. `@ts-expect-error` is allowed only with a comment explaining why.
- Use `type` for object shapes and unions. Use string-literal unions instead of `enum`.
- Exported non-component functions declare their return types. Validate external data (API input, `localStorage`,
  URL params) at the boundary before trusting its type.
- Import with the `@/` alias for anything under `src/`. Use relative imports only within the same folder.

## 10. Styling (Tailwind CSS v4)

- **Tailwind utility classes only.** Don't add CSS Modules or per-component `.css` files, and don't use inline `style={{}}`
  except for values computed at runtime (e.g. per-item positions in `AmbientSky`).
- `src/app/globals.css` is the **only** stylesheet. It holds:
  - the raw tokens on `:root`, with dark-mode overrides,
  - the `@theme inline` block that maps them to utilities (`bg-bg`, `bg-bg-elev`, `text-ink`, `text-ink-soft`,
    `border-line`, `text-accent`, `bg-accent-soft`, `bg-glow`, `rounded-card`, `shadow-soft`, `ease-calm`, `animate-drift`),
  - the `site-container` utility (page width plus the 16px gutter). Use it instead of Tailwind's `container`,
  - a small `@layer base` (body, headings, `kbd`, focus ring, reduced motion).
- **Use the theme tokens, not Tailwind's default palette.** No `bg-white`, `text-gray-500`, `bg-[#hex]`, and so on.
  If you need a new color, add a token to `:root` (plus its dark value), then map it in `@theme`.
  Arbitrary values may reference tokens (`shadow-[0_0_36px_-6px_var(--glow)]`) but never raw colors.
- Fixed tokens (game frame `--frame-*`, biome art `--art-*`) are the same in both themes. Use biome art as
  `bg-(image:--art-<biome>)`.
- **Write complete class names.** Tailwind only sees literal strings, so never build classes like `` `bg-${x}` ``.
  Map variants to full class strings (see `biomeArt` in `GameCard.tsx`).
- Conditional classes: use a simple ternary inside a template string. Add a `cn()` helper in `src/utils/`
  (with `clsx` + `tailwind-merge`) only once 3+ components need to merge classes.
- If a class list repeats in 2+ places within a file, hoist it into a `const` in that file (see `navLink` in
  `SiteHeader.tsx`). If it repeats across files, make a component, not an `@apply` class.
- Keep class order consistent: layout → box → spacing → typography → color → effects → states/variants.
- Motion stays calm: `duration-400` to `duration-900` with `ease-calm`.
- Simple content pages use `<PageSection>` for their heading and spacing instead of custom wrappers.

## 11. Naming

| Thing             | Convention               | Example                    |
| ----------------- | ------------------------ | -------------------------- |
| Components        | `PascalCase.tsx`         | `GameCard.tsx`             |
| Hooks             | `useCamelCase.ts`        | `useDailySeed.ts`          |
| Utils / lib       | `kebab-case.ts`          | `format-duration.ts`       |
| Domain-local      | `<domain>.<kind>.ts`     | `games.types.ts`           |
| Services          | `<resource>.service.ts`  | `lantern.service.ts`       |
| Route folders     | `kebab-case`             | `daily-world/`             |

---

## 12. Adding a game

1. Put the build at `public/games/<slug>/index.html`. It must run standalone.
2. Add an entry to `games` in `src/lib/games.ts` (unique `slug`, `biome`, `controls`, `src`).
   A new biome needs a type in `src/types/game.ts`, a label in `biomeLabel`, an `--art-<biome>` token in `globals.css`, and an entry in `biomeArt` in `GameCard.tsx`.
3. Nothing else is needed. Cards, routes and metadata are generated, so don't hand-write per-game pages.

## 13. Calm design rules (product requirements)

- Palette: soft, low-contrast, earthy (moss, sage, mist, dusk, lantern glow). No pure black or white and no saturated reds.
- Motion: slow and eased (`var(--ease)`, 400–900ms). Nothing flashes or shakes. `prefers-reduced-motion` is honored globally, so don't override it.
- Sound: never autoplay on the site shell. Games start audio only after a user gesture.
- Copy: gentle, second person. No urgency, countdowns, scores-as-pressure or guilt-tripping streaks.
- No ads, pop-ups, modals on load, or dark patterns.
- Accessibility: semantic HTML, visible `:focus-visible`, `aria-hidden` on decoration, and AA text contrast.
- Responsive: works at 360px wide with a 16px gutter and no horizontal scroll.

## 14. Don'ts

- Don't add another UI/CSS framework or component library (Tailwind is the styling system), a state library, ORM or analytics without asking.
- Don't create empty folders or layers "for later".
- Don't edit `public/games/**` as part of site changes. Treat them as vendored builds.
- Don't commit `.next/`, `node_modules/` or `.env*.local`. Never hard-code secrets. Read them from env in `src/lib/env.ts`.
