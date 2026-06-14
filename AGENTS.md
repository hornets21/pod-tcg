# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router TypeScript app for the POD TCG pack opening simulator. Route files live in `src/app`, including season routes in `src/app/[season]`, Discord OAuth in `src/app/auth`, and Hall of Fame pages in `src/app/hall-of-fame`. Shared UI is in `src/components`; unboxing components and cutscenes are in `src/components/unboxing`. Hooks live in `src/hooks`, card data/types in `src/data`, and static media in `public/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local dev server on port `8080`.
- `npm run build`: create the static export build configured by `next.config.ts`.
- `npm run start`: run the production Next.js server after building.
- `npm run lint`: run ESLint with Next.js rules.

Use `npm install` after dependency changes and commit `package-lock.json`.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and existing App Router patterns. Name components in PascalCase, hooks as `useSomething`, and route client components as `*Client.tsx` when browser APIs or interactivity are required. Prefer imports through the `@/*` alias for files under `src`. Follow the repository's current style: two-space indentation, double quotes, semicolons, Tailwind CSS 4 utilities, and custom animation CSS in `src/app/globals.css`.

## Testing Guidelines

No dedicated test framework is configured. Before submitting changes, run `npm run lint` and `npm run build`. For UI or gameplay changes, manually verify the affected route in `npm run dev`, especially pack opening, collection persistence, lot reveal flow, audio controls, and Discord auth redirects.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `fix audio`, `add event card`, and `fix version`. Keep commits focused and concise. Pull requests should include a brief summary, changed routes or systems, verification steps, and screenshots or recordings for visual changes.

## Gameplay & Content Rules

Preserve documented rarity behavior unless explicitly asked to change it: packs contain 5 unique cards, `isGacha='N'` cards are excluded, God Pack chance is 1%, and `EVENT` shares the Common pool. Do not alter role ID `1356458345812459611` rainbow aura behavior unless requested. Keep audio conservative: BGM around `0.02`, SFX around `0.15`, and heavy impacts no higher than `0.2` to `0.25`.

## Security & Configuration Tips

Use `.env.example` for local configuration. Keep secrets out of Git; expose only `NEXT_PUBLIC_*` values that are safe in the browser. The app uses static export (`output: "export"`) and unoptimized images, so avoid server-only features unless the deployment model changes.
