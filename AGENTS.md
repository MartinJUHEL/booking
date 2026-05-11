<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DJ Booking Manager — Frontend

## Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend**: External ASP.NET Core 8 API (separate repo: `BookingApi/`)
- **Auth**: Google Identity Services (client-side) + JWT stored in localStorage
- **API Client**: `src/lib/api-client.ts` — centralized HTTP client with JWT auth
- **Roles**: Artist / Booker (chosen at onboarding)

## How Auth Works

1. Login page uses Google Identity Services (GIS) button
2. Google returns an `idToken` (credential)
3. Frontend sends it to `POST /api/auth/google` on the backend
4. Backend returns a JWT, stored in `localStorage` via `api.setToken()`
5. `AuthProvider` (`src/lib/auth-context.tsx`) manages user state + provides `useAuth()` hook
6. All API calls attach `Authorization: Bearer <jwt>` via `api-client.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/api-client.ts` | HTTP client (base URL from `NEXT_PUBLIC_API_URL`, JWT management, file upload/download) |
| `src/lib/auth-context.tsx` | `AuthProvider`, `useAuth()` hook (login, logout, refreshUser) |
| `src/app/page.tsx` | Main dashboard (client component, loads data via API) |
| `src/app/login/page.tsx` | Google login with GIS |
| `src/app/onboarding/` | Role selection (artist/booker) |
| `src/app/settings/` | Google Calendar settings |
| `src/components/Dashboard.tsx` | Table / Calendar / Promoters tabs + booking detail panel |
| `src/components/BookingForm.tsx` | Booking form with venue autocomplete, hotel fields, transport legs, ticket upload |
| `src/components/BookingTable.tsx` | Booking list table with clickable rows |
| `src/components/BookingDetail.tsx` | Side panel showing booking details (hotel, transport with ticket download, checklist) |
| `src/components/CalendarView.tsx` | Monthly calendar view |
| `src/components/ArtistSelector.tsx` | Header dropdown for bookers to switch artists |
| `src/components/PromoterForm.tsx` | Create/edit promoter modal |
| `src/components/PromoterList.tsx` | Promoter cards grid view |
| `src/components/types.ts` | Shared TypeScript interfaces (Booking, Hotel, Transport, TransportLeg, Promoter) |

## Data Model (TypeScript)

### Hotel (nested object in Booking)
```ts
interface Hotel {
  booked: boolean;
  name: string | null;
  address: string | null;
  bookingNumber: string | null;
  breakfast: boolean;
  lateCheckout: boolean;
}
```

### TransportLeg (nested in Transport)
```ts
interface TransportLeg {
  id?: string;
  order: number;
  mode: string | null; // plane, train, bus, car, taxi, ferry, other
  departureLocation: string | null;
  arrivalLocation: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  bookingReference: string | null;
  carrier: string | null;
  notes: string | null;
  ticketFileName: string | null;    // stored file (UUID.ext)
  ticketOriginalName: string | null; // original upload name
}
```

`Booking.transports` is an array of `Transport` (typically outbound + return), each with ordered `legs`.

Ticket upload uses `api.upload()` (multipart) to `POST /api/transport-legs/{id}/ticket`. Download uses `api.downloadFile()` (fetch + blob URL to pass JWT auth). Legs must be saved (have an `id`) before a ticket can be uploaded.

Hotel address autocomplete uses `GET /api/places/search?q=` (backend proxies Google Places API).

## Roles

### Artist
- Sees only their own bookings and promoters
- Standard dashboard with Table / Calendar / Promoters tabs

### Booker
- Manages multiple artists via API
- Artist selector in header to switch between artists
- Views/creates bookings and promoters on behalf of the selected artist
- Adds artists by email (artist must have an account with role "artist")
- `/onboarding` page for first-time role selection

## Booking Detail Panel

Clicking a row in `BookingTable` opens a slide-in side panel (`BookingDetail`) showing:
- Event info (date, venue, city, promoter, status, fee)
- **Hotel/lodging** (name, address with Google Maps link, booking number, breakfast/late checkout tags)
- **Transport** info with ticket download links
- Checklist (contract, fees)
- Notes

The panel has a "Modifier" button to open the edit form.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:5160`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID (for GIS login button) |

## Important Notes

- **No backend code in this repo** — all API routes, database, auth validation are in the `BookingApi/` repo
- **All pages are client components** — no server components with data fetching
- **All fetch calls use `api` from `src/lib/api-client.ts`** — never use raw `fetch()` for API calls
- **File uploads** use `api.upload()` (multipart/form-data with JWT auth)
- **File downloads** use `api.downloadFile()` (fetch + blob URL to pass JWT auth, not plain `<a href>`)
- **Auth redirects**: pages check `useAuth()` and redirect to `/login` if no user, or `/onboarding` if no role
- **Hotel autocomplete** calls `GET /api/places/search?q=` on the backend (no Google Maps JS SDK on the frontend)
