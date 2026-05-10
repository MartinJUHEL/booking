import type { VenueProvider, VenueResult } from "./types";

interface PlacePrediction {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
  };
}

/**
 * Parse "Rue X, Toulouse, France" → { city: "Toulouse", country: "France" }
 * La secondaryText de Google contient généralement: [adresse], ville, pays
 */
function parseCityCountry(secondary: string): {
  city: string;
  country: string;
} {
  const parts = secondary.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2],
      country: parts[parts.length - 1],
    };
  }
  if (parts.length === 1) {
    return { city: "", country: parts[0] };
  }
  return { city: "", country: "" };
}

export class GooglePlacesProvider implements VenueProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<VenueResult[]> {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          input: query,
          includedPrimaryTypes: [
            "night_club",
            "bar",
            "event_venue",
            "live_music_venue",
            "concert_hall",
          ],
          languageCode: "fr",
        }),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const suggestions: PlacePrediction[] = data.suggestions || [];

    return suggestions.slice(0, 8).map((s) => {
      const pred = s.placePrediction;
      const name = pred.structuredFormat?.mainText?.text || pred.text.text;
      const secondary = pred.structuredFormat?.secondaryText?.text || "";
      const { city, country } = parseCityCountry(secondary);

      return {
        label: pred.text.text,
        name,
        city,
        country,
      };
    });
  }
}
