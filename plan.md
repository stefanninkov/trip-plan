# Build Plan & Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                      │
│  React 19 + Vite + TypeScript + Tailwind CSS v4     │
│  Zustand (state) · Firebase Auth (Google sign-in)   │
│  vite-plugin-pwa (offline)                          │
└──────────────┬──────────────────┬───────────────────┘
               │ HTTPS            │ Firestore SDK
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Firebase Cloud Fns  │  │  Firestore (eur-w1)  │
│  (europe-west1)      │  │  users / trips       │
│                      │  └──────────────────────┘
│  /generate-trip ─────┼──► Anthropic Claude API
│  /search-flights ────┼──► SerpAPI (Google Flights)
│  /search-hotels ─────┼──► SerpAPI (Google Hotels)
│  /search-places ─────┼──► SerpAPI (Google Maps)
│  /search-web ────────┼──► SerpAPI (Google Search)
│  /export-calendar ───┼──► Google Calendar API v3
└──────────────────────┘
```

---

## Folder Structure

```
trip-plan/
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── icons/                        # PWA icons (192, 512)
│
├── src/
│   ├── main.tsx                      # App entry point
│   ├── App.tsx                       # Router + layout wrapper
│   ├── index.css                     # Tailwind base + CSS variables
│   ├── vite-env.d.ts
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── GoogleSignInButton.tsx
│   │   │   ├── AuthGuard.tsx         # Redirect if not signed in
│   │   │   └── UserMenu.tsx          # Avatar + sign out
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Sidebar + header + main area
│   │   │   ├── Sidebar.tsx           # Trip history list
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx         # Bottom nav for mobile
│   │   │
│   │   ├── wizard/
│   │   │   ├── TripWizard.tsx        # Wizard container + step logic
│   │   │   ├── StepOrigin.tsx        # Where from?
│   │   │   ├── StepDestinations.tsx  # Where to? (single/multi-city)
│   │   │   ├── StepDates.tsx         # Start + end date
│   │   │   ├── StepTravelers.tsx     # Number of travelers
│   │   │   ├── StepAdvanced.tsx      # Progressive disclosure panel
│   │   │   ├── WizardProgress.tsx    # Step indicator bar
│   │   │   └── WizardNav.tsx         # Back / Next / Generate buttons
│   │   │
│   │   ├── plan/
│   │   │   ├── PlanView.tsx          # Full plan layout
│   │   │   ├── PlanHeader.tsx        # Trip title, summary, meta
│   │   │   ├── DayCard.tsx           # Collapsible day card
│   │   │   ├── TimeBlock.tsx         # Single time block (08:00–10:00)
│   │   │   ├── TimelineDnd.tsx       # Drag-and-drop timeline wrapper
│   │   │   ├── HotelOptions.tsx      # 3-tier hotel comparison
│   │   │   ├── CostBreakdown.tsx     # Per-day cost table
│   │   │   ├── GrandTotal.tsx        # Category + grand total summary
│   │   │   ├── TipBlock.tsx          # Tip / warning callout
│   │   │   ├── PracticalInfo.tsx     # Packing, docs, apps, weather
│   │   │   ├── BlockEditor.tsx       # Inline editor for a time block
│   │   │   └── PlanSkeleton.tsx      # Skeleton UI during streaming
│   │   │
│   │   ├── search/
│   │   │   ├── SearchPanel.tsx       # Global search bar + results
│   │   │   ├── SearchButton.tsx      # Per-section "Search web" button
│   │   │   ├── FlightResults.tsx     # Flight search results card
│   │   │   ├── HotelResults.tsx      # Hotel search results card
│   │   │   ├── PlaceResults.tsx      # Place/restaurant results card
│   │   │   └── SearchSkeleton.tsx    # Loading state for search
│   │   │
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── DatePicker.tsx
│   │       ├── Badge.tsx             # Category / budget level chips
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Skeleton.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── CurrencyDisplay.tsx   # Dual currency formatter
│   │
│   ├── pages/
│   │   ├── HomePage.tsx              # Landing / dashboard
│   │   ├── NewTripPage.tsx           # Wizard page
│   │   ├── TripPage.tsx              # View/edit a generated plan
│   │   ├── HistoryPage.tsx           # All saved trips
│   │   ├── SharedTripPage.tsx        # Public read-only view
│   │   └── NotFoundPage.tsx
│   │
│   ├── store/
│   │   ├── wizard-store.ts           # Wizard form state
│   │   ├── trip-store.ts             # Current trip plan state
│   │   ├── auth-store.ts             # User auth state
│   │   └── ui-store.ts               # Sidebar open, modals, toasts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # Firebase auth hook
│   │   ├── useTrips.ts               # CRUD operations for trips
│   │   ├── useGenerateTrip.ts        # Claude API streaming hook
│   │   ├── useSearch.ts              # SerpAPI search hook
│   │   ├── useExport.ts              # PDF, text, calendar export
│   │   └── useDragAndDrop.ts         # DnD logic for timeline
│   │
│   ├── types/
│   │   ├── trip-plan.ts              # TripPlan, DayPlan, TimeBlock, etc.
│   │   ├── wizard.ts                 # WizardInputs, WizardStep
│   │   ├── search.ts                 # SearchResult, FlightResult, etc.
│   │   ├── user.ts                   # User profile type
│   │   └── api.ts                    # API request/response types
│   │
│   ├── constants/
│   │   ├── budget-levels.ts          # Budget / Mid / Comfortable
│   │   ├── categories.ts             # transport, hotel, food, activity
│   │   ├── currencies.ts             # Currency codes + symbols
│   │   ├── wizard-steps.ts           # Step definitions
│   │   └── routes.ts                 # Route paths
│   │
│   ├── utils/
│   │   ├── format-currency.ts        # Dual currency formatting
│   │   ├── date-helpers.ts           # Date formatting, ranges
│   │   ├── cost-calculator.ts        # Sum costs by category/day
│   │   ├── export-pdf.ts             # PDF generation logic
│   │   ├── export-text.ts            # Copy-friendly plain text
│   │   ├── share-link.ts             # Generate/parse share tokens
│   │   ├── cn.ts                     # clsx + tailwind-merge helper
│   │   └── logger.ts                 # Dev-only console logger
│   │
│   └── lib/
│       ├── firebase.ts               # Firebase app init + services
│       └── api-client.ts             # Cloud Functions HTTP client
│
├── functions/
│   ├── src/
│   │   ├── index.ts                  # Export all functions
│   │   ├── generate-trip.ts          # Claude API → SSE stream
│   │   ├── search-flights.ts         # SerpAPI Google Flights
│   │   ├── search-hotels.ts          # SerpAPI Google Hotels
│   │   ├── search-places.ts          # SerpAPI Google Maps
│   │   ├── search-web.ts             # SerpAPI Google Search
│   │   ├── export-calendar.ts        # Google Calendar API
│   │   └── prompts/
│   │       ├── system-prompt.ts      # Claude system prompt
│   │       └── user-prompt.ts        # User message builder
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── .env.example                      # Template (no secrets)
├── .gitignore
├── claude.md
├── plan.md
├── progress.md
└── design.md
```

---

## Data Models

### Trip Plan (Claude API Response)

```typescript
// types/trip-plan.ts

interface TripPlan {
  tripTitle: string
  summary: string
  totalBudget: CostRange & { currency: string }
  travelers: number
  bookAhead: string[]
  packingTips: string[]
  weatherNote: string
  documentsNeeded: string[]
  appsToDownload: string[]
  days: DayPlan[]
  grandTotal: {
    byCategory: {
      transport: CostRange
      hotel: CostRange
      food: CostRange
      activity: CostRange
    }
    total: CostRange
  }
}

interface DayPlan {
  id: string                          // Client-generated for DnD keying
  dayNumber: number
  date: string                        // ISO date (YYYY-MM-DD)
  title: string
  location: string
  blocks: TimeBlock[]
  costs: CostItem[]
  dailyTotal: CostRange
  hotels: HotelOption[] | null
}

interface TimeBlock {
  id: string                          // Client-generated for DnD keying
  time: string                        // "08:00–12:00"
  title: string
  description: string
  tip: string | null
  warning: string | null
}

interface CostItem {
  id: string
  item: string
  category: CostCategory
  amount: CostRange
  currency: string
  note: string | null
}

interface HotelOption {
  name: string
  stars: number                       // 0 for hostels
  pricePerNight: number
  currency: string
  highlight: string
  tier: BudgetTier
}

interface CostRange {
  min: number
  max: number
}

type CostCategory = 'transport' | 'hotel' | 'food' | 'activity'
type BudgetTier = 'budget' | 'mid' | 'comfortable'
```

### Wizard Inputs

```typescript
// types/wizard.ts

interface TripInputs {
  // Essential (always shown)
  origin: string
  destinations: Destination[]
  startDate: string                   // ISO date
  endDate: string                     // ISO date

  // Advanced (progressive disclosure)
  travelers: number                   // default: 1
  budgetLevel: BudgetTier             // default: 'mid'
  interests: string[]                 // e.g. ['food', 'history', 'nature']
  pace: 'relaxed' | 'moderate' | 'packed'
  accommodationType: 'hostel' | 'hotel' | 'apartment' | 'any'
  dietaryNeeds: string
  mobilityNotes: string
  homeCurrency: string                // For dual display, default: 'EUR'
  notes: string                       // Free-text special requests
}

interface Destination {
  city: string
  country: string
  nights: number                      // How many nights here
}

type WizardStep = 'origin' | 'destinations' | 'dates' | 'travelers' | 'advanced'
```

### User

```typescript
// types/user.ts

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: string                   // ISO timestamp
  lastLogin: string                   // ISO timestamp
}
```

### Search Results

```typescript
// types/search.ts

interface FlightResult {
  airline: string
  departure: string                   // "14:30"
  arrival: string                     // "16:45"
  duration: string                    // "2h 15m"
  stops: number
  price: number
  currency: string
  bookingUrl: string
}

interface HotelResult {
  name: string
  stars: number
  pricePerNight: number
  currency: string
  rating: number                      // e.g. 8.5
  reviewCount: number
  thumbnailUrl: string
  bookingUrl: string
  highlights: string[]
}

interface PlaceResult {
  name: string
  type: string                        // "restaurant", "attraction", etc.
  rating: number
  reviewCount: number
  priceLevel: string                  // "$", "$$", "$$$"
  address: string
  thumbnailUrl: string
  mapsUrl: string
}

interface WebSearchResult {
  title: string
  snippet: string
  url: string
}
```

### API Types

```typescript
// types/api.ts

interface GenerateTripRequest {
  inputs: TripInputs
}

// Response is SSE stream of partial TripPlan JSON

interface SearchFlightsRequest {
  origin: string
  destination: string
  date: string                        // ISO date
  returnDate?: string
  travelers: number
}

interface SearchHotelsRequest {
  location: string
  checkIn: string
  checkOut: string
  guests: number
}

interface SearchPlacesRequest {
  query: string                       // e.g. "restaurants in Rome"
  location: string
}

interface SearchWebRequest {
  query: string
}

interface ExportCalendarRequest {
  tripId: string
  accessToken: string                 // Google OAuth token
}

// Firestore document (stored trip)
interface TripDocument {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  inputs: TripInputs
  plan: TripPlan | null
  status: 'generating' | 'complete' | 'error'
  shared: boolean
  shareToken: string | null           // Random unguessable string
}
```

---

## Firestore Schema

### Collections

```
firestore/
├── users/{userId}
│   ├── uid: string
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL: string | null
│   ├── createdAt: timestamp
│   └── lastLogin: timestamp
│
└── trips/{tripId}
    ├── userId: string
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    ├── inputs: TripInputs (map)
    ├── plan: TripPlan | null (map)
    ├── status: 'generating' | 'complete' | 'error'
    ├── shared: boolean
    └── shareToken: string | null
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /trips/{tripId} {
      // Owner can do anything
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;

      // Anyone can read shared trips
      allow read: if resource.data.shared == true;

      // Authenticated users can create trips (userId must match)
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## API Endpoints (Cloud Functions)

### POST `/generate-trip`
Proxies request to Claude API, returns SSE stream.

**Request:**
```json
{
  "inputs": { TripInputs }
}
```

**Response:** `text/event-stream` — chunks of partial JSON as Claude generates.

**Flow:**
1. Validate request + auth token
2. Build system prompt + user message from inputs
3. Call Claude API with `stream: true`
4. Pipe streamed chunks as SSE events to client
5. On completion, return full parsed TripPlan

---

### POST `/search-flights`
**Request:**
```json
{
  "origin": "BEG",
  "destination": "FCO",
  "date": "2026-07-15",
  "returnDate": "2026-07-22",
  "travelers": 2
}
```

**Response:**
```json
{
  "results": [FlightResult, ...]
}
```

---

### POST `/search-hotels`
**Request:**
```json
{
  "location": "Rome, Italy",
  "checkIn": "2026-07-15",
  "checkOut": "2026-07-18",
  "guests": 2
}
```

**Response:**
```json
{
  "results": [HotelResult, ...]
}
```

---

### POST `/search-places`
**Request:**
```json
{
  "query": "best trattorias",
  "location": "Trastevere, Rome"
}
```

**Response:**
```json
{
  "results": [PlaceResult, ...]
}
```

---

### POST `/search-web`
**Request:**
```json
{
  "query": "best time to visit Swiss Alps June 2026"
}
```

**Response:**
```json
{
  "results": [WebSearchResult, ...]
}
```

---

### POST `/export-calendar`
**Request:**
```json
{
  "tripId": "abc123",
  "accessToken": "ya29.xxx"
}
```

**Response:**
```json
{
  "calendarId": "xxx",
  "eventsCreated": 14,
  "calendarUrl": "https://calendar.google.com/..."
}
```

---

## Claude Prompt Design

### System Prompt

```
You are an expert travel planner. You create detailed, day-by-day travel itineraries with hour-by-hour time blocks, real hotel and restaurant names, specific transport routes, and accurate cost estimates.

RULES:
1. Use REAL place names — actual hotels, restaurants, train stations, attractions.
2. For transport between cities, recommend specific options (train numbers, airlines, bus companies) with realistic prices and durations.
3. Provide 3 hotel options per night at different tiers: budget, mid-range, and comfortable.
4. Include hour-by-hour time blocks (e.g., "08:00–09:30") for each day.
5. Add practical tips (pro tips, warnings, what to book ahead).
6. Calculate ALL costs for the total number of travelers. Show per-person where relevant.
7. Use the correct local currency for each country. Also note the equivalent in the traveler's home currency.
8. Respect the requested budget level and pace.
9. For multi-city trips, optimize the route order for efficiency.
10. Respond ONLY with valid JSON matching the provided schema. No markdown, no preamble.
```

### User Message Template

```
Plan a trip with these details:

- Origin: {origin}
- Destinations: {destinations as comma-separated list with nights per city}
- Dates: {startDate} to {endDate} ({totalDays} days)
- Travelers: {travelers}
- Budget level: {budgetLevel}
- Interests: {interests as comma-separated list}
- Pace: {pace}
- Accommodation preference: {accommodationType}
- Dietary needs: {dietaryNeeds}
- Mobility notes: {mobilityNotes}
- Home currency: {homeCurrency}
- Special notes: {notes}

Respond with a JSON object matching this TypeScript interface:

{TripPlan interface definition}
```

---

## Component Tree

```
App
├── AuthGuard
│   └── AppShell
│       ├── Header
│       │   ├── UserMenu
│       │   └── (nav links)
│       ├── Sidebar (desktop)
│       │   └── (trip history list)
│       ├── MobileNav (mobile)
│       └── <Routes>
│           ├── HomePage
│           ├── NewTripPage
│           │   └── TripWizard
│           │       ├── WizardProgress
│           │       ├── StepOrigin
│           │       ├── StepDestinations
│           │       ├── StepDates
│           │       ├── StepTravelers
│           │       ├── StepAdvanced
│           │       └── WizardNav
│           ├── TripPage
│           │   └── PlanView
│           │       ├── PlanHeader
│           │       ├── PracticalInfo
│           │       ├── TimelineDnd
│           │       │   └── DayCard (per day)
│           │       │       ├── TimeBlock (per block)
│           │       │       │   ├── TipBlock
│           │       │       │   └── BlockEditor (edit mode)
│           │       │       ├── HotelOptions
│           │       │       └── CostBreakdown
│           │       ├── SearchPanel
│           │       │   ├── SearchButton (per section)
│           │       │   ├── FlightResults
│           │       │   ├── HotelResults
│           │       │   └── PlaceResults
│           │       └── GrandTotal
│           ├── HistoryPage
│           ├── SharedTripPage
│           │   └── PlanView (read-only)
│           └── NotFoundPage
│
└── Toast (global, rendered at root)
```

---

## State Management

### Zustand Stores

**`wizard-store.ts`** — Wizard form state
- `currentStep`, `inputs` (TripInputs), `setField()`, `nextStep()`, `prevStep()`, `reset()`

**`trip-store.ts`** — Active trip plan
- `currentTrip` (TripDocument), `plan` (TripPlan), `isGenerating`, `streamProgress`
- `updateBlock()`, `moveBlock()`, `deleteBlock()`, `addBlock()`
- `updateHotelSelection()`, `updateCostItem()`

**`auth-store.ts`** — Auth state
- `user` (UserProfile | null), `isLoading`, `signIn()`, `signOut()`

**`ui-store.ts`** — UI state
- `sidebarOpen`, `activeModal`, `toasts[]`, `addToast()`, `removeToast()`

### Firebase (Persistent)
- User profile in `users/{uid}`
- Saved trips in `trips/{tripId}`
- Trip plan JSON stored in the trip document

### Local State (useState)
- Form field focus/validation
- Dropdown open/closed
- DnD drag state
- Search input text
- Expanded/collapsed day cards

---

## Build Phases

### Phase A — Project Setup & Auth
- [ ] Init Vite + React 19 + TypeScript project
- [ ] Configure Tailwind CSS v4 with design tokens from design.md
- [ ] Set up Firebase project (Auth, Firestore, Functions, Hosting)
- [ ] Configure ESLint + Prettier
- [ ] Set up Google Fonts (JetBrains Mono, IBM Plex Mono)
- [ ] Implement Firebase Auth with Google sign-in
- [ ] Create AppShell layout (Header, Sidebar, MobileNav)
- [ ] Set up React Router with all page routes
- [ ] Create shared components (Button, Input, Card, Modal, Toast)

### Phase B — Trip Wizard
- [ ] Build TripWizard container with step logic
- [ ] StepOrigin — city/airport autocomplete input
- [ ] StepDestinations — add/remove cities, set nights per city
- [ ] StepDates — date range picker
- [ ] StepTravelers — number stepper
- [ ] StepAdvanced — progressive disclosure (interests, pace, diet, etc.)
- [ ] WizardProgress bar + WizardNav (back/next/generate)
- [ ] Wizard state management (Zustand store)

### Phase C — AI Trip Generation
- [ ] Create Cloud Function: `generate-trip` (Claude API proxy)
- [ ] Write system prompt + user message templates
- [ ] Implement SSE streaming from Cloud Function to client
- [ ] Create `useGenerateTrip` hook with stream parsing
- [ ] Build PlanSkeleton (loading UI that fills as data streams)
- [ ] Parse streamed JSON into TripPlan structure
- [ ] Error handling (timeout, malformed JSON, API errors)

### Phase D — Plan Display & Editing
- [ ] PlanView layout with PlanHeader
- [ ] DayCard with collapsible expand/collapse
- [ ] TimeBlock display with tip/warning callouts
- [ ] HotelOptions — 3-tier comparison cards
- [ ] CostBreakdown — per-day table with category colors
- [ ] GrandTotal — category totals + grand total
- [ ] CurrencyDisplay — dual currency formatting
- [ ] PracticalInfo section (packing, docs, apps, weather)
- [ ] TimelineDnd — drag-and-drop reordering of blocks between days
- [ ] BlockEditor — inline editing of time blocks
- [ ] Add/delete blocks and days

### Phase E — Web Search Integration
- [ ] Create Cloud Functions: search-flights, search-hotels, search-places, search-web
- [ ] SearchButton component (per-section trigger)
- [ ] SearchPanel with global search bar
- [ ] FlightResults, HotelResults, PlaceResults display cards
- [ ] `useSearch` hook with loading/error states
- [ ] Allow replacing plan items with search results (e.g., swap hotel)

### Phase F — Trip Management
- [ ] Save trip to Firestore on generation complete
- [ ] Trip history page — list all saved trips
- [ ] Load saved trip from Firestore into plan view
- [ ] Delete trip with confirmation
- [ ] Edit trip inputs and regenerate
- [ ] Sidebar trip list (desktop)
- [ ] Auto-save edits (debounced Firestore writes)

### Phase G — Export & Share
- [ ] PDF export (print-friendly layout via CSS + html2pdf or jsPDF)
- [ ] Copy plan as formatted text (WhatsApp/Telegram friendly)
- [ ] Generate secret share link (random token stored in Firestore)
- [ ] SharedTripPage — read-only public view (no auth required)
- [ ] Google Calendar API integration (OAuth + event creation)
- [ ] ExportCalendar Cloud Function

### Phase H — PWA & Polish
- [ ] Configure vite-plugin-pwa (service worker, manifest)
- [ ] Offline support: cache saved trips for offline viewing
- [ ] Install prompt / Add to Home Screen
- [ ] Final responsive polish (375px, 768px, 1024px)
- [ ] Accessibility audit (keyboard nav, ARIA, contrast)
- [ ] Performance audit (bundle size, lazy loading, Lighthouse)
- [ ] Error boundaries on all route-level components
- [ ] Empty states for no trips, no search results, etc.
