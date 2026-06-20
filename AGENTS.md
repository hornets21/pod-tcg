# Repository Guidelines

## Project Structure & Module Organization

POD TCG uses Next.js 16 App Router, TypeScript, React 19, Tailwind CSS 4, and React Three Fiber. Routes live in `src/app`: season gameplay under `src/app/[season]`, Discord OAuth under `src/app/auth`, and rankings under `src/app/hall-of-fame`. Shared UI is in `src/components`; Three.js scenes are in `src/components/three`, and reveal flows in `src/components/unboxing`. Hooks are in `src/hooks`, card data/types in `src/data`, and static media in `public/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies; commit resulting `package-lock.json` updates.
- `npm run dev`: start Next.js locally on port `8080`.
- `npm run lint`: run ESLint across the repository.
- `npm run build`: produce the static export in `out/`.
- `npm run start`: run the production server after building.

## Coding Style & Naming Conventions

Use React function components, two-space indentation, double quotes, and semicolons. Name components in PascalCase, hooks `useSomething`, and interactive routes `*Client.tsx`. Prefer the `@/*` alias. Use Tailwind for routine styling and CSS for complex animation. Keep Three.js animation inside `useFrame` or React Spring rather than rendering React each frame.

## Testing Guidelines

No automated test framework or coverage target is configured. Before submitting, run `npm run lint` and `npm run build`. Test affected routes with `npm run dev`, including both seasons where relevant. Verify pack opening, card uniqueness, collection persistence, lot reveal, audio, responsive layout, and Discord redirects.

## Commit & Pull Request Guidelines

History uses short imperative subjects such as `add new card`, `fix version`, and `convert 3d webGL`. Keep commits focused and avoid mixing unrelated cleanup. Pull requests should summarize the change, identify affected routes or systems, list verification performed, link relevant issues, and attach visual evidence for UI work.

## Gameplay, Visual, and Audio Constraints

Packs contain five unique cards; exclude `isGacha='N'`; God Pack chance is 1%; `EVENT` shares the Common pool. Do not change role ID `1356458345812459611` rainbow aura behavior unless explicitly requested. The current single-pack tear animation in `OpeningClient.tsx` and `PackSingleThree.tsx` is approved: preserve its timing, projected size, lower-pack visibility, and non-rotating motion unless directly instructed otherwise. Keep BGM near `0.02`, SFX near `0.15`, and heavy impacts at or below `0.2`–`0.25`.

## Security & Deployment

Copy configuration from `.env.example`. Never commit secrets; expose only browser-safe `NEXT_PUBLIC_*` values. `next.config.ts` uses `output: "export"` and unoptimized images, so avoid server-only Next.js features unless the deployment model is intentionally changed.
