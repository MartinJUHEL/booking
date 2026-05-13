<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gigflow — Frontend

## Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend**: External ASP.NET Core 8 API (separate repo: `BookingApi/`)
- **Auth**: Google Identity Services (client-side) + Email/password login + Email verification (6-digit code) + JWT via httpOnly cookie (set by backend)
- **API Client**: `src/lib/api-client.ts` — centralized HTTP client with cookie-based auth (`credentials: "include"`)
- **Roles**: Artist / Booker (chosen at onboarding). Bookers belong to an Agency (created during onboarding, other bookers join via ephemeral invitation links).

## How Auth Works

### Google OAuth
1. Login page uses Google Identity Services (GIS) button
2. Google returns an `idToken` (credential)
3. Frontend sends it to `POST /api/auth/google` on the backend
4. Backend returns user info in body + sets JWT as httpOnly cookie
5. `AuthProvider` (`src/lib/auth-context.tsx`) manages user state + provides `useAuth()` hook
6. All API calls include cookies via `credentials: "include"` in `api-client.ts`

### Email/Password
1. User fills in email/password (+ optional name) on login page → `POST /api/auth/register`
2. Backend creates user, sends 6-digit verification code via email
3. Frontend shows verification code input screen (6-digit, monospace, auto-focus)
4. User enters code → `POST /api/auth/verify-email` → backend sets JWT cookie → redirect to `/onboarding`
5. Subsequent logins via `POST /api/auth/login` → if email unverified, backend returns 403 + auto-resends code → frontend redirects to verification screen
6. "Resend code" button with 120s cooldown timer
7. Login page toggles between "Se connecter" and "S'inscrire" modes
8. **Password strength validation**: real-time indicator with 5 criteria (8+ chars, uppercase, lowercase, digit, special char). Submit button disabled until all criteria are met.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/api-client.ts` | HTTP client (base URL from `NEXT_PUBLIC_API_URL`, cookie-based auth with `credentials: "include"`, file upload/download) |
| `src/lib/auth-context.tsx` | `AuthProvider`, `useAuth()` hook — User includes `agencyId`, `agencyName` |
| `src/app/page.tsx` | Main dashboard (client component, loads data via API) |
| `src/app/login/page.tsx` | Login/register form (email/password + Google GIS) with email verification step |
| `src/app/onboarding/` | Role selection (artist/booker) + agency creation step for bookers |
| `src/app/agency/page.tsx` | Agency management (booker-only): invite members, list members (owner can remove), pending invitations, artists list (invite by email, remove) |
| `src/app/agency/join/[token]/page.tsx` | Accept ephemeral agency invitation link (validates token, email match, expiry) |
| `src/app/promoters/page.tsx` | Promoters management page (booker-only): list, search, create, edit, delete promoters |
| `src/app/settings/` | Google Calendar settings |
| `src/components/HeaderBar.tsx` | Shared top navigation bar — icon nav tabs (Booking, Agence, Promoteurs for bookers / Configuration for artists), user dropdown with logout. Uses `useAuth()` and `usePathname()`. Active tab highlighted with purple underline. |
| `src/components/Dashboard.tsx` | Artist dashboard (read-only): Liste / Calendar tabs, stats cards, search + status filter, no create/edit/delete |
| `src/components/BookerDashboard.tsx` | Booker dashboard: all bookings across managed artists, year-based pagination, artist/status/text filters, sortable table, Liste/Calendar toggle, stats cards |
| `src/components/BookingForm.tsx` | Booking form with venue autocomplete (auto-fills address/city/country), hotel fields, transport legs, ticket upload. Organized in fieldset sections: Venue, Cachet (fee + all inclusive checkbox), Status, Hotel, Transport |
| `src/components/BookingTable.tsx` | Booking list table with clickable rows |
| `src/components/BookingDetail.tsx` | Side panel showing booking details (hotel, transport with ticket download, checklist) |
| `src/components/CalendarView.tsx` | Monthly calendar view (generic, supports custom label via `renderLabel` prop) |
| `src/components/ArtistSelector.tsx` | Header dropdown for bookers to switch artists (used in artist-specific views) |
| `src/components/PromoterForm.tsx` | Create/edit promoter modal |
| `src/components/PromoterList.tsx` | Promoter cards grid view (clickable to open detail panel) |
| `src/components/PromoterDetail.tsx` | Side panel showing promoter details with copy-to-clipboard on each field |
| `src/components/AdvancingReview.tsx` | Advancing management in BookingDetail: send link, list forms, open full review panel with per-field validation |
| `src/app/advancing/[formId]/page.tsx` | Public advancing form page (magic link auth + multi-section form with auto-save). Also exports `SECTIONS`, `AdvancingForm`, `AdvancingFieldValue` types |
| `src/app/invitations/[token]/page.tsx` | Booker invitation accept/reject page (artist clicks email link, authenticates, accepts or rejects) |
| `src/components/types.ts` | Shared TypeScript interfaces (BookingListItem, DashboardBookingItem, DashboardResponse, PaginatedResponse, Booking, Hotel, Transport, TransportLeg, Promoter). Promoter uses `agencyId` (not `userId`). |

## Data Model (TypeScript)

### BookingListItem (used for list/table/calendar views)
```ts
interface BookingListItem {
  id: string;
  date: string;
  time: string | null;
  promoter: string;
  promoterId: string | null;
  venue: string;
  city: string;
  country: string;
  fee: number;
  allInclusive: boolean;
  contractSigned: boolean;
  agencyFeesPaid: boolean;
  artistFeesPaid: boolean;
  hotelBooked: boolean;
  transportBooked: boolean;
  status: string;
}
```

### Booking (full detail, fetched via `GET /api/bookings/{id}`)
The full `Booking` interface extends the list fields with: `venueAddress`, `venueWebsite`, `hotel: Hotel`, `transports: Transport[]`, `notes`, `userId`, `user`, `createdAt`, `updatedAt`.

### DashboardBookingItem (booker dashboard, extends BookingListItem)
Adds `artistId: string` and `artistName: string` to `BookingListItem`. Fetched via `GET /api/dashboard/bookings?year=`.

### DashboardResponse
```ts
interface DashboardResponse {
  items: DashboardBookingItem[];
  year: number;
  availableYears: number[];
}
```

### Hotel (nested object in Booking)
```ts
interface Hotel {
  booked: boolean;
  name: string | null;
  address: string | null;
  bookingNumber: string | null;
  breakfast: boolean;
  lateCheckout: boolean;
  checkIn: string | null;
  notes: string | null;
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
- **Read-only access** to their own bookings — no create, edit, or delete
- Dashboard with **Liste / Calendar** tabs (no action buttons, no edit/delete)
- Booking detail panel is read-only (no "Modifier" button)
- **Pending booker invitations** shown as a banner above the dashboard with Accept/Reject buttons
- **My bookers** section: shows linked bookers as chips with a remove button (`DELETE /api/artists/bookers/{bookerId}`)

### Booker
- **Belongs to an Agency** — created during onboarding. Other bookers join via ephemeral invitation links (5-min expiry, sent by email from `/agency` page)
- **Agency management page** (`/agency`): invite bookers by email, view members (owner sees "Admin" badge and remove buttons), view pending invitations, manage artists (invite by email, list with remove buttons)
- **Join flow** (`/agency/join/[token]`): booker clicks invitation link from email, authenticates if needed (stores redirect in `localStorage`), sees agency info, clicks "Rejoindre". Email must match invitation. Link expires after 5 minutes (HTTP 410).
- **Promoters are shared across the agency** — all bookers in the same agency see the same promoters (no per-artist filtering). Managed from the dedicated `/promoters` page.
- **Default view**: `BookerDashboard` — shows all bookings across all managed artists in a sortable table/calendar, loaded by year (default: current year). Includes stats cards (upcoming dates, unpaid agency fees, unpaid artist fees).
- **"+ Nouvelle date" button**: creates a booking for a selected artist. If only one artist, opens the form directly; if multiple, shows an artist selector modal first.
- **Filters**: text search + artist dropdown + status dropdown; year navigation with arrows and dropdown; sortable columns (date, artist, venue, city, fee, status)
- **Calendar view**: shows all dates with artist name prefix (e.g. "DJ X - Club Y")
- Clicking a booking opens `BookingDetail` side panel
- **Artists are managed from the Agency page** (`/agency`) — invite by email, list with remove buttons. Dashboard only shows bookings.
- Can send advancing form links to promoters and validate sent fields one by one
- **No access to Google Calendar settings** — the "Configuration" link is hidden, `/settings` redirects bookers to `/`.
- **Top bar navigation** (booker): Booking | Agence | Promoteurs — each with icon, active tab underlined in purple
- `/onboarding` page: step 1 = role selection, step 2 = agency creation (bookers without an agency are redirected back here; joining is only via invitation link)

## Booking List/Detail Pattern

The frontend uses a list/detail split to minimize API payload:

- **List**: `page.tsx` fetches `BookingListItem[]` from `GET /api/bookings` (lightweight DTO). This data is passed to `Dashboard`, `BookingTable`, and `CalendarView`.
- **Detail**: clicking a booking row or calendar event opens `BookingDetail`, which receives a `bookingId` and fetches the full `Booking` from `GET /api/bookings/{id}`. The detail panel has a "Modifier" button that passes the full `Booking` to `BookingForm` for editing.
- **Quick actions**: the `BookingTable` has clickable toggle buttons on "Fees Ag." and "Fees Art." columns. Clicking them calls `PUT /api/bookings/{id}` with only the toggled field (`agencyFeesPaid` or `artistFeesPaid`) and updates the list state optimistically.

## Booking Detail Panel

Clicking a row in `BookingTable` opens a slide-in side panel (`BookingDetail`) which fetches the full booking detail from `GET /api/bookings/{id}`. It shows:
- Event info (date, venue with address/website, city, country, promoter with inline details, status, fee with "All Inclusive" tag if applicable)
- **Hotel/lodging** (name, address with Google Maps link, booking number, check-in, breakfast/late checkout tags, additional notes)
- **Transport** info with ticket download links
- Checklist (contract, fees)
- Notes

The panel has a "Modifier" button to open the edit form.

## Advancing Form (Booker Only)

The advancing feature allows bookers to send a form link to promoters to collect event details.

### BookingDetail Integration (`AdvancingReview` component)
- **Advancing section** in BookingDetail panel (visible only for bookers, `role === "booker"`)
- **Send Link**: form to enter promoter email → creates form (if first) or adds access → sends invite email + copies link to clipboard
- **Single form per booking**: shows field counts (sent/validated), list of email accesses with revoke buttons
- **"Review Advancing Form" button**: appears when any field has been sent (`sentFields > 0`), opens a full-width slide-in panel for field-by-field validation

### Review Panel (slide-in, `AdvancingReviewPanel`)
- Progress bar showing validated/total sent fields
- Sections as collapsible accordions with per-section progress counters
- Only shows fields the promoter has **sent** (not drafts)
- Each sent field shows: label, promoter's value, **"Valider" button** (validate → copies to booking)
- Validated fields show green "Valide" badge

### Public Advancing Page (`/advancing/[formId]`)
- **Step 1**: Email input → request verification code
- **Step 2**: 6-digit code input → verify → get advancing JWT (stored in `localStorage`)
- **Step 3**: Multi-section form with accordions, auto-save on blur/change (1500ms debounce, immediate save on blur). Uses `isFocusedRef` to prevent server state from overwriting local input while typing.
- **Pre-filled fields**: fields already filled by the booker at booking creation appear as validated (green badge, greyed out `opacity-60`, read-only). The promoter cannot modify or re-send them.
- **Per-field "Send" button**: each non-validated field has a "Send" button next to it. Promoter fills a field (auto-saved as draft) then clicks "Send" to make it visible to the booker
- **No global "Submit" button** — fields are sent individually
- **Validated fields are locked**: inputs are `readOnly`, the "Send" button is hidden, backend also rejects save/send attempts (400)
- Sections: Show, Promoter, Venue, Tickets, Contacts, Event Details, Hotel, Dinner, Arrival, Show Transfers, Departure
- **Venue autocomplete**: the `venueName` field uses a `venue-search` type with autocomplete via `/api/venues/search`. Selecting a result auto-fills `venueAddress`, `venueCity`, `venueCountry` via an `onAutoFill` callback
- **Hotel autocomplete**: the `hotelName` field uses a `hotel-search` type with autocomplete via `/api/places/search` (Google Places). Selecting a result auto-fills `hotelAddress` via `onAutoFill`
- Section headers show sent/total counter (e.g. "3/7 sent")
- Field status indicators: saved (blue, draft), sent (purple, visible to booker), validated (green, confirmed by booker)
- Token expiry: re-entering email + new code restores access (data persisted server-side)
- Uses direct `fetch()` with advancing JWT (not `api-client.ts` which uses the main JWT)

## Promoter Detail Panel

Clicking a promoter card in `PromoterList` opens a slide-in side panel (`PromoterDetail`) which displays all promoter fields organized in sections:
- **Contact**: name, email, phone
- **Structure**: company, address (line 1 + 2), postal code, city, country, website
- **Legal info**: SIRET, APE, VAT number
- **Signatory**: name and role
- **Notes** and **Statistics** (booking count)

Each field has a **click-to-copy** feature for easy use in invoices/contracts. The panel has a "Modifier" button to open the edit form.

All promoter fields (company, address, email, phone, siret, ape, vatNumber, companyWebsite) are synced bidirectionally with the advancing form `promoter` section. Hotel fields (name, address, bookingNumber, checkIn, lateCheckout, breakfast, notes) are synced with the advancing form `hotel` section; validating any hotel field via advancing auto-sets `hotel.booked = true`. Venue fields (venue name, address, city, country, website) are synced with the advancing form `venue` section; the `venueName` field uses venue autocomplete to auto-fill address/city/country.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:5160`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID (for GIS login button) |

## Important Notes

- **No backend code in this repo** — all API routes, database, auth validation are in the `booking-api` repo
- **All pages are client components** — no server components with data fetching
- **All fetch calls use `api` from `src/lib/api-client.ts`** — never use raw `fetch()` for API calls
- **Cookie-based auth**: JWT is stored in an httpOnly cookie set by the backend. The frontend never reads/writes the JWT directly. All requests use `credentials: "include"`. Logout calls `POST /api/auth/logout` to clear the cookie.
- **File uploads** use `api.upload()` (multipart/form-data with cookie auth)
- **File downloads** use `api.downloadFile()` (fetch + blob URL with cookie auth, not plain `<a href>`)
- **Auth redirects**: pages check `useAuth()` and redirect to `/login` if no user, `/onboarding` if no role, or `/onboarding` if booker without agency. Invitation page (`/invitations/[token]`) and agency join page (`/agency/join/[token]`) store redirect URL in `localStorage` (`redirectAfterLogin`) so the user returns after login.
- **Hotel autocomplete** calls `GET /api/places/search?q=` on the backend (no Google Maps JS SDK on the frontend)
- **Advancing page** (`/advancing/[formId]`) is the only page that uses direct `fetch()` instead of `api-client.ts`, because it uses a separate advancing JWT (not the main user JWT)
- **Advancing review** is only visible to bookers — the `BookingDetail` component receives a `role` prop and conditionally renders the `AdvancingReview` component
- **Loading states on submit buttons**: every form that triggers an API call (create/update) must have a `saving` state: button shows "Enregistrement..." text, is `disabled`, and has `disabled:opacity-50 disabled:cursor-not-allowed` classes. The `onSave` prop type should be `() => void | Promise<void>` to support async handlers. Pattern: wrap `await onSave(...)` in `setSaving(true)` / `finally { setSaving(false) }`.

## Deployment

### Vercel (Production & Preview)

- **Platform**: Vercel (https://vercel.com)
- **Config**: `vercel.json` — Next.js framework, npm build
- **Preview environments**: automatic — every PR creates a unique preview URL
- **GitHub integration**: connect the `booking` repo in Vercel dashboard, set root directory to repo root

### Environment Variables (Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (Railway production URL for prod, staging URL for previews) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID (for GIS login button) |

### Key Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment config (Next.js framework, build command, output directory) |
