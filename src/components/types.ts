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

export interface TransportLeg {
  id?: string;
  order: number;
  mode: string | null;
  departureLocation: string | null;
  arrivalLocation: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  bookingReference: string | null;
  carrier: string | null;
  notes: string | null;
}

export interface Transport {
  id?: string;
  type: "outbound" | "return";
  booked: boolean;
  legs: TransportLeg[];
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
  hotel: Hotel;
  transports: Transport[];
  notes: string | null;
  status: string;
  userId: string;
  user?: { name: string | null; email: string };
  createdAt: string;
  updatedAt: string;
}
