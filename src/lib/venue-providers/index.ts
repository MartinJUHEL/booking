import type { VenueProvider } from "./types";
import { NominatimProvider } from "./nominatim";
import { GooglePlacesProvider } from "./google-places";

export type { VenueResult } from "./types";

/**
 * Retourne le provider configuré via VENUE_PROVIDER dans .env
 *
 * - "google"    → Google Places API (nécessite GOOGLE_PLACES_API_KEY)
 * - "nominatim" → OpenStreetMap Nominatim (gratuit, sans clé)
 *
 * Par défaut : "google" si la clé est présente, sinon "nominatim"
 */
export function getVenueProvider(): VenueProvider {
  const provider = process.env.VENUE_PROVIDER?.toLowerCase();

  if (provider === "nominatim") {
    return new NominatimProvider();
  }

  if (provider === "google" || !provider) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      return new GooglePlacesProvider(apiKey);
    }
    // Fallback si pas de clé
    return new NominatimProvider();
  }

  return new NominatimProvider();
}
