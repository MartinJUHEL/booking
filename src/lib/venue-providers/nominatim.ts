import type { VenueProvider, VenueResult } from "./types";

export class NominatimProvider implements VenueProvider {
  async search(query: string): Promise<VenueResult[]> {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("accept-language", "fr");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "dj-booking-app/1.0" },
    });

    if (!res.ok) return [];

    const data = await res.json();

    return data.map(
      (item: {
        display_name: string;
        name: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          country?: string;
        };
      }) => {
        const addr = item.address || {};
        return {
          label: item.display_name,
          name: item.name,
          city:
            addr.city || addr.town || addr.village || addr.municipality || "",
          country: addr.country || "",
        };
      }
    );
  }
}
