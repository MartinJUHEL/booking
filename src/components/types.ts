export interface Booking {
  id: string;
  date: string;
  time: string | null;
  promoter: string;
  venue: string;
  city: string;
  country: string;
  fee: number;
  contractSigned: boolean;
  agencyFeesPaid: boolean;
  artistFeesPaid: boolean;
  transportBooked: boolean;
  transportInfo: string | null;
  hotelBooked: boolean;
  hotelInfo: string | null;
  notes: string | null;
  status: string;
  userId: string;
  user?: { name: string | null; email: string };
  createdAt: string;
  updatedAt: string;
}
