# Claude Code — Project Rules for Trip Plan

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.x |
| Build | Vite | 6.x |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.x |
| Auth | Firebase Auth | 11.x (Google sign-in) |
| Database | Firebase Firestore | 11.x (europe-west1) |
| Functions | Firebase Cloud Functions | 6.x (europe-west1, Node 20) |
| Hosting | Firebase Hosting | — |
| AI | Anthropic Claude API | claude-sonnet-4-20250514, server-side only |
| Search | SerpAPI | REST API (flights, hotels, maps) |
| Calendar | Google Calendar API | v3 (OAuth) |
| Fonts | Google Fonts | JetBrains Mono + IBM Plex Mono |
| PWA | Vite PWA Plugin | vite-plugin-pwa |

## Coding Conventions

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `TripWizard.tsx`, `DayCard.tsx`)
- **Hooks**: `camelCase.ts` prefixed with `use` (e.g., `useTripStore.ts`, `useAuth.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `format-currency.ts`, `date-helpers.ts`)
- **Constants**: `kebab-case.ts` in `constants/` (e.g., `budget-levels.ts`)
- **Types**: `kebab-case.ts` in `types/` (e.g., `trip-plan.ts`)
- **Firebase functions**: `kebab-case.ts` in `functions/src/` (e.g., `generate-trip.ts`)

### Import Order
1. React / external libraries
2. Firebase imports
3. Store / hooks
4. Components
5. Utils / constants / types
6. Styles / assets

Blank line between each group. Sorted alphabetically within each group.

### TypeScript
- `strict: true` in tsconfig — no exceptions
- No `any` types — use `unknown` and narrow
- All component props must have a named `interface` (e.g., `interface DayCardProps`)
- Prefer `type` for unions/intersections, `interface` for object shapes
- Use `as const` for constant objects

### Components
- Functional components only — no class components
- Named exports only (no `export default`) — except page-level route components
- Props interface always defined above the component
- Destructure props in the function signature
- One component per file (small helper components inside the same file are OK)

### Styling
- Tailwind utility classes only — no inline `style={}` props
- Mobile-first: base styles for 375px, then `md:` for 768px, `lg:` for 1024px
- Use `cn()` helper (clsx + tailwind-merge) for conditional classes
- Dark theme only — no light theme tokens needed
- No CSS files except for global base styles in `index.css`
- Color tokens via CSS custom properties defined in Tailwind config

### State Management
- **Zustand**: App-wide state (current trip, wizard state, UI state, user preferences)
- **Firebase/Firestore**: Persistent data (saved trips, user profile)
- **Local state (`useState`)**: Form inputs, UI toggles, component-scoped ephemeral state
- **URL state**: Current route, trip ID, share tokens
- Never duplicate Firestore data in Zustand — read from Firestore, cache in Zustand only when needed for performance

### API Rules
- **All Claude API calls go through Firebase Cloud Functions** — never expose the API key to the client
- **All SerpAPI calls go through Firebase Cloud Functions** — never expose the API key to the client
- Claude responses must be streamed via SSE from the Cloud Function to the client
- API keys stored in Firebase environment config (`functions.config()`) or Secret Manager
- Client communicates with Cloud Functions via HTTPS callable functions or REST endpoints
- Every API call must have a timeout (30s for search, 120s for Claude generation)

### Firebase Rules
- **Region**: `europe-west1` for Firestore, Cloud Functions, and Hosting
- **Firestore collections**: `users`, `trips` (flat structure, no deep subcollections)
- **Security rules**: Users can only CRUD their own trips (`request.auth.uid == resource.data.userId`)
- **Shared trips**: Readable by anyone if `shared == true` (no auth required for shared read)
- **Indexes**: Create composite indexes as needed, document them in `firestore.indexes.json`

### Git Commit Format
Use conventional commits:
```
feat: add trip wizard date picker step
fix: correct currency conversion for CHF
refactor: extract cost calculation into utility
docs: update plan.md with Phase C tasks
style: adjust day card spacing on mobile
chore: update Firebase SDK to 11.x
```

### Error Handling
- `try/catch` on every async operation
- User-friendly error messages — never show raw error objects or stack traces
- Toast notifications for transient errors (network, API)
- Inline error states for form validation
- Fallback UI for component-level errors (React Error Boundary)
- Log errors to console in development only — no `console.log` in production builds

### Performance
- Lazy load route-level components with `React.lazy()` + `Suspense`
- Debounce search inputs (300ms)
- Skeleton loaders for all async content
- Virtualize long lists (day blocks, search results) if >20 items
- Optimize images: WebP format, lazy loading, explicit dimensions
- Keep bundle size under 200KB initial JS (before lazy chunks)

### Accessibility
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`, `<button>`)
- ARIA labels on all interactive elements without visible text
- Keyboard navigation: all interactive elements focusable and operable
- Focus management on route transitions and modal open/close
- Color contrast: minimum 4.5:1 ratio for text (WCAG AA)
- Skip-to-content link

### Testing
- Unit tests for utility functions (currency conversion, date formatting, cost calculations)
- Component tests for critical flows (wizard steps, plan display)
- No tests for trivial components or pure layout
- Test files co-located with source: `ComponentName.test.tsx`
- Use Vitest + React Testing Library

## What NOT to Do

- No `any` types — ever
- No `console.log` in production — use a logger utility that strips in production
- No hardcoded strings for UI text — use constants
- No unused imports — ESLint will catch these
- No inline styles (`style={}`) — use Tailwind classes
- No default exports except route-level page components
- No direct Firestore access from components — always go through store or hooks
- No API keys in client-side code — everything through Cloud Functions
- No `!important` in styles
- No `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why
- No nested ternaries — use early returns or helper functions
- No `var` — use `const` by default, `let` only when reassignment is needed
