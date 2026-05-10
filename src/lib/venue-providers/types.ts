export interface VenueResult {
  label: string;
  name: string;
  city: string;
  country: string;
}

export interface VenueProvider {
  search(query: string): Promise<VenueResult[]>;
}
