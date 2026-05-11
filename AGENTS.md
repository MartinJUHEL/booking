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
| `src/components/Dashboard.tsx` | Table / Calendar / Promoters tabs + booking/promoter detail panels |
| `src/components/BookingForm.tsx` | Booking form with venue autocomplete, hotel fields, transport legs, ticket upload |
| `src/components/BookingTable.tsx` | Booking list table with clickable rows |
| `src/components/BookingDetail.tsx` | Side panel showing booking details (hotel, transport with ticket download, checklist) |
| `src/components/CalendarView.tsx` | Monthly calendar view |
| `src/components/ArtistSelector.tsx` | Header dropdown for bookers to switch artists |
| `src/components/PromoterForm.tsx` | Create/edit promoter modal |
| `src/components/PromoterList.tsx` | Promoter cards grid view (clickable to open detail panel) |
| `src/components/PromoterDetail.tsx` | Side panel showing promoter details with copy-to-clipboard on each field |
| `src/components/AdvancingReview.tsx` | Advancing management in BookingDetail: send link, list forms, open full review panel with per-field validation |
| `src/app/advancing/[formId]/page.tsx` | Public advancing form page (magic link auth + multi-section form with auto-save). Also exports `SECTIONS`, `AdvancingForm`, `AdvancingFieldValue` types |
| `src/components/types.ts` | Shared TypeScript interfaces (BookingListItem, Booking, Hotel, Transport, TransportLeg, Promoter) |

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
  contractSigned: boolean;
  agencyFeesPaid: boolean;
  artistFeesPaid: boolean;
  hotelBooked: boolean;
  transportBooked: boolean;
  status: string;
}
```

### Booking (full detail, fetched via `GET /api/bookings/{id}`)
The full `Booking` interface extends the list fields with: `hotel: Hotel`, `transports: Transport[]`, `notes`, `userId`, `user`, `createdAt`, `updatedAt`.

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
- Can send advancing form links to promoters and validate sent fields one by one
- `/onboarding` page for first-time role selection

## Booking List/Detail Pattern

The frontend uses a list/detail split to minimize API payload:

- **List**: `page.tsx` fetches `BookingListItem[]` from `GET /api/bookings` (lightweight DTO). This data is passed to `Dashboard`, `BookingTable`, and `CalendarView`.
- **Detail**: clicking a booking row or calendar event opens `BookingDetail`, which receives a `bookingId` and fetches the full `Booking` from `GET /api/bookings/{id}`. The detail panel has a "Modifier" button that passes the full `Booking` to `BookingForm` for editing.
- **Quick actions**: the `BookingTable` has clickable toggle buttons on "Fees Ag." and "Fees Art." columns. Clicking them calls `PUT /api/bookings/{id}` with only the toggled field (`agencyFeesPaid` or `artistFeesPaid`) and updates the list state optimistically.

## Booking Detail Panel

Clicking a row in `BookingTable` opens a slide-in side panel (`BookingDetail`) which fetches the full booking detail from `GET /api/bookings/{id}`. It shows:
- Event info (date, venue, city, promoter, status, fee)
- **Hotel/lodging** (name, address with Google Maps link, booking number, breakfast/late checkout tags)
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
- Each sent field shows: label, promoter's value, **"Valider" button** (validate → copies to booking), **"x" button** (reject with comment)
- Validated fields show green "Valide" badge
- Rejected fields: promoter sees rejection message, can re-edit and re-send

### Public Advancing Page (`/advancing/[formId]`)
- **Step 1**: Email input → request verification code
- **Step 2**: 6-digit code input → verify → get advancing JWT (stored in `localStorage`)
- **Step 3**: Multi-section form with accordions, auto-save on blur/change (500ms debounce)
- **Pre-filled fields**: fields already filled by the booker at booking creation appear as validated (green badge, greyed out `opacity-60`, read-only). The promoter cannot modify or re-send them.
- **Per-field "Send" button**: each non-validated field has a "Send" button next to it. Promoter fills a field (auto-saved as draft) then clicks "Send" to make it visible to the booker
- **No global "Submit" button** — fields are sent individually
- **Validated fields are locked**: inputs are `readOnly`, the "Send" button is hidden, backend also rejects save/send attempts (400)
- Sections: Show, Promoter, Venue, Tickets, Contacts, Event Details, Hotel, Dinner, Arrival, Show Transfers, Departure
- Section headers show sent/total counter (e.g. "3/7 sent")
- Field status indicators: saved (blue, draft), sent (purple, visible to booker), validated (green, confirmed by booker), rejected (red with booker's comment)
- Token expiry: re-entering email + new code restores access (data persisted server-side)
- Uses direct `fetch()` with advancing JWT (not `api-client.ts` which uses the main JWT)

## Promoter Detail Panel

Clicking a promoter card in `PromoterList` opens a slide-in side panel (`PromoterDetail`) which displays all promoter fields organized in sections:
- **Contact**: name, company, email, phone
- **Legal info**: headquarters, SIRET, APE, VAT number
- **Signatory**: name and role
- **Notes** and **Statistics** (booking count)

Each field has a **click-to-copy** feature for easy use in invoices/contracts. The panel has a "Modifier" button to open the edit form.

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
- **Advancing page** (`/advancing/[formId]`) is the only page that uses direct `fetch()` instead of `api-client.ts`, because it uses a separate advancing JWT (not the main user JWT)
- **Advancing review** is only visible to bookers — the `BookingDetail` component receives a `role` prop and conditionally renders the `AdvancingReview` component
