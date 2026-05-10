<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DJ Booking Manager

## Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Database**: SQLite via Prisma 7 (`@prisma/adapter-libsql`)
- **Auth**: NextAuth v5 (beta) with Google OAuth
- **Roles**: Artist / Booker (chosen at onboarding)
- **Calendar**: Google Calendar API sync

## Roles

### Artist
- Sees only their own bookings and promoters
- Standard dashboard with Table / Calendar / Promoters tabs

### Booker
- Manages multiple artists via `BookerArtist` join table
- Artist selector in header to switch between artists
- Views/creates bookings and promoters on behalf of the selected artist
- Adds artists by email (artist must have an account with role "artist")
- `/onboarding` page for first-time role selection

### Key files for roles
- `prisma/schema.prisma` — `BookerArtist` model, `User.role` and `User.artistName`
- `src/app/onboarding/` — Role selection page
- `src/app/api/user/role/route.ts` — Set user role
- `src/app/api/artists/route.ts` — List/add managed artists (booker only)
- `src/components/ArtistSelector.tsx` — Header dropdown for bookers

## Venue Search

Le champ Venue du formulaire de booking utilise une autocomplétion via un système de providers interchangeables.

### Providers disponibles

| Provider | Fichier | Clé API requise |
|----------|---------|-----------------|
| Google Places (New) | `src/lib/venue-providers/google-places.ts` | `GOOGLE_PLACES_API_KEY` |
| Nominatim / OSM | `src/lib/venue-providers/nominatim.ts` | Aucune |

### Configuration

Variable d'environnement `VENUE_PROVIDER` dans `.env` :
- `"google"` → Google Places API (défaut si `GOOGLE_PLACES_API_KEY` est présente)
- `"nominatim"` → OpenStreetMap Nominatim (gratuit, fallback)

### Structure

```
src/lib/venue-providers/
├── types.ts            # Interface VenueProvider + VenueResult
├── google-places.ts    # Google Places Autocomplete (max 5 types)
├── nominatim.ts        # OpenStreetMap Nominatim
└── index.ts            # Factory getVenueProvider()
```

### Ajouter un nouveau provider

1. Créer un fichier dans `src/lib/venue-providers/` qui implémente `VenueProvider`
2. L'ajouter dans `index.ts` (`getVenueProvider()`)
3. Ajouter la valeur dans `VENUE_PROVIDER`

### API Route

`GET /api/venues/search?q=...` → délègue au provider configuré, retourne `VenueResult[]`

## Promoteurs

Onglet dédié à la gestion des promoteurs avec leurs informations de facturation. Les promoteurs peuvent être sélectionnés lors de la création d'une date.

### Modèle Promoter

| Champ | Description |
|-------|-------------|
| `name` | Nom du contact |
| `email` / `phone` | Coordonnées |
| `company` | Nom de la structure |
| `headquarters` | Siège social |
| `siret` | Numéro SIRET |
| `ape` | Code APE |
| `vatNumber` | Numéro de TVA intracommunautaire |
| `signatory` | Nom du signataire |
| `signatoryRole` | Qualité du signataire (Gérant, Président...) |

### Lien avec les bookings

- `Booking.promoterId` (FK optionnelle vers `Promoter`)
- Le champ `Booking.promoter` (string) est conservé pour la saisie libre
- Dans le formulaire de booking, 3 modes : **Liste** (sélection existant), **Saisie libre**, **+ Créer** (création inline)

### API Routes

- `GET/POST /api/promoters` — Liste et création
- `PUT/DELETE /api/promoters/[id]` — Modification et suppression

### Composants

- `src/components/PromoterList.tsx` — Affichage en grille de cartes
- `src/components/PromoterForm.tsx` — Modal de création/édition

## Key files

- `src/components/BookingForm.tsx` — Formulaire de booking avec autocomplétion venue et sélection promoteur
- `src/components/Dashboard.tsx` — Dashboard avec onglets Table / Calendrier / Promoteurs
- `src/app/api/bookings/route.ts` — CRUD bookings
- `src/app/api/promoters/route.ts` — CRUD promoteurs
- `src/lib/google-calendar.ts` — Sync Google Calendar
- `prisma/schema.prisma` — Schéma DB
