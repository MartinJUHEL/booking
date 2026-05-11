export interface Promoter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  headquarters: string | null;
  siret: string | null;
  ape: string | null;
  vatNumber: string | null;
  signatory: string | null;
  signatoryRole: string | null;
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  booked: boolean;
  name: string | null;
  address: string | null;
  bookingNumber: string | null;
  breakfast: boolean;
  lateCheckout: boolean;
}

export interface Booking {
  id: string;
  date: string;
  time: string | null;
  promoter: string;
  promoterId: string | null;
  promoterRel?: Promoter | null;
  venue: string;
  city: string;
  country: string;
  fee: number;
  contractSigned: boolean;
  agencyFeesPaid: boolean;
  artistFeesPaid: boolean;
  transportBooked: boolean;
  transportInfo: string | null;
  hotel: Hotel;
  notes: string | null;
  status: string;
  userId: string;
  user?: { name: string | null; email: string };
  createdAt: string;
  updatedAt: string;
}
