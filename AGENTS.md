<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DJ Booking Manager

## Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Database**: SQLite via Prisma 7 (`@prisma/adapter-libsql`)
- **Auth**: NextAuth v5 (beta) with Google OAuth
- **Calendar**: Google Calendar API sync

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

## Key files

- `src/components/BookingForm.tsx` — Formulaire de booking avec autocomplétion venue
- `src/app/api/bookings/route.ts` — CRUD bookings
- `src/lib/google-calendar.ts` — Sync Google Calendar
- `prisma/schema.prisma` — Schéma DB
