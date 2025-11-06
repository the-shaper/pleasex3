# Agent Guidelines for pleasex3

## Commands

- **Development**: `pnpm dev` (runs on localhost:3000)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint` (ESLint with Next.js + Storybook rules)
- **Test**: `vitest` (uses Vitest with Storybook integration)
- **Storybook**: `pnpm storybook` (runs on localhost:6006)
- **Single test**: `vitest run <test-file>` or `vitest <test-file>`

## Code Style

- **Package Manager**: Use `pnpm` (not npm)
- **Imports**: Use `@/*` path aliases for src directory imports
- **Components**: PascalCase for components, kebab-case for files
- **Types**: Centralized in `src/lib/types.ts`, use strict TypeScript
- **Stories**: Every component should have a `.stories.tsx` file
- **Formatting**: Follow ESLint config (Next.js + Storybook rules)
- **Error Handling**: Use proper TypeScript types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
- **Server**: Check if dev server is running before restarting

## Talking / Language Rules

- \*\*Don't agree with everything I say unless you are certain you understood what I am saying or that what I'm saying makes sense
- \*\*Don't say "you're absolutely right!" every time I point out something wrong. Say "You are correct" If, and only if, what I am saying makes sense. If you don't feel sure but need to give me reassurance, then say "I think I understand what you're saying. Would this work? :"

## Action Rules

- **Running dev** Never EVER run pnpm dev without asking first. Leave the "pnpm dev" to the user (me).
