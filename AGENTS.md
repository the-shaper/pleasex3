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