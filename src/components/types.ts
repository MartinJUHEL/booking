export interface Promoter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  companyWebsite: string | null;
  siret: string | null;
  ape: string | null;
  vatNumber: string | null;
  signatory: string | null;
  signatoryRole: string | null;
  notes: string | null;
  agencyId: string;
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
  checkIn: string | null;
  notes: string | null;
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
  ticketFileName: string | null;
  ticketOriginalName: string | null;
}

export interface Transport {
  id?: string;
  type: "outbound" | "return";
  booked: boolean;
  legs: TransportLeg[];
}

export interface BookingListItem {
  id: string;
  date: string;
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

export interface DashboardBookingItem extends BookingListItem {
  artistId: string;
  artistName: string;
}

export interface DashboardResponse {
  items: DashboardBookingItem[];
  year: number;
  availableYears: number[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Booking {
  id: string;
  date: string;
  promoter: string;
  promoterId: string | null;
  promoterRel?: Promoter | null;
  venue: string;
  venueAddress: string | null;
  venueWebsite: string | null;
  city: string;
  country: string;
  fee: number;
  allInclusive: boolean;
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
  // Proposal fields
  format: string | null;
  setDuration: number | null;
  lineup: string | null;
  ticketPrice: string | null;
  announcementDate: string | null;
  numberOfInvitations: number | null;
  exclusivity: string | null;
  commissionPercent: number | null;
  paymentTerms: string | null;
  contractFileUrl: string | null;
  contractOriginalName: string | null;
}

export interface ArtistBooking {
  id: string;
  date: string;
  promoter: string;
  venue: string;
  venueAddress: string | null;
  venueWebsite: string | null;
  city: string;
  country: string;
  fee: number;
  allInclusive: boolean;
  status: string;
  hotel: Hotel;
  transports: Transport[];
  notes: string | null;
  format: string | null;
  setDuration: number | null;
  // Advancing fields (feuille de route)
  eventName: string | null;
  eventWebsite: string | null;
  capacity: number | null;
  doorsOpen: string | null;
  doorsClose: string | null;
  ageRestrictions: string | null;
  tourManager: string | null;
  technician: string | null;
  artistHandler: string | null;
  stageManager: string | null;
  stageFloor: string | null;
  furtherDetails: string | null;
  soundcheckRequired: string | null;
  restaurant: string | null;
  dinnerPickUpTime: string | null;
  dinnerMeetingPoint: string | null;
  dinnerDriver: string | null;
  timetable: string | null;
  // Arrival fields
  arrivalTime: string | null;
  arrivalLocation: string | null;
  arrivalMeetingPoint: string | null;
  arrivalDriver: string | null;
  arrivalDuration: string | null;
  // Show Transfers fields
  transferToVenuePickup: string | null;
  transferToVenueMeetingPoint: string | null;
  transferToVenueDriver: string | null;
  transferToVenueDuration: string | null;
  transferToHotelPickup: string | null;
  transferToHotelMeetingPoint: string | null;
  transferToHotelDriver: string | null;
  // Departure fields
  departurePickup: string | null;
  departureMeetingPoint: string | null;
  departureDriver: string | null;
  departureLocation: string | null;
}
